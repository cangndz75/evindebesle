import { prisma } from "@/lib/db";
import { generateInvoiceNo } from "./generateInvoiceNo";
import { generateInvoiceHtml } from "./generateInvoiceHtml";
import { htmlToPdfBuffer } from "./htmlToPdfBuffer";
import { uploadInvoicePdf } from "./uploadInvoicePdf";
import { sendInvoiceMail } from "./sendInvoiceMail";
import { v4 as uuidv4 } from "uuid";

export async function generateAndSaveInvoice(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: true,
      services: { include: { service: true } },
    },
  });

  if (!appointment || !appointment.isPaid) return;

  const invoiceNo = generateInvoiceNo();
  const ettn = uuidv4().toUpperCase();
  const totalPrice = appointment.finalPrice || 0;
  const taxRate = 20;
  const taxAmount = totalPrice * (taxRate / 100);

  const html = generateInvoiceHtml({
    user: {
      name: appointment.user.name || "",
      email: appointment.user.email,
    },
    appointment,
    services: appointment.services.map((s) => ({
    name: s.service.name,
    price: s.service.price,
  })),
    totalPrice,
    invoiceNo,
  });

  const pdfBuffer = await htmlToPdfBuffer(html);
  const { url } = await uploadInvoicePdf(pdfBuffer, `invoice-${appointmentId}`);

  await prisma.invoice.create({
    data: {
      appointmentId,
      invoiceNo,
      ettn,
      fileUrl: url,
      totalPrice,
      taxRate,
      taxAmount,
      isSent: true,
      sentAt: new Date(),
    },
  });

  await sendInvoiceMail({
    to: appointment.user.email,
    name: appointment.user.name || "",
    fileUrl: url,
  });
}
