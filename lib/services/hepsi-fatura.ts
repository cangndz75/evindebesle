import { prisma } from "@/lib/db";
import { withDefaultCompanyProfile } from "@/lib/invoice/company-profile";
import { randomUUID } from "crypto";

const HEPSI_API_USER = (process.env.HEPSIBURADA_API_USER || "").trim();
const HEPSI_API_PASSWORD = (process.env.HEPSIBURADA_API_PASSWORD || "").trim();

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const HEPSI_API_BASE = IS_PRODUCTION
  ? "https://api.hepsiburadaefaturam.com"
  : "https://testapi.hepsiburadaefaturam.com";

const HEPSI_PORTAL_BASE = IS_PRODUCTION
  ? "https://www.hepsiburadaefaturam.com"
  : "https://test.hepsiburadaefaturam.com";
const VAT_RATE = 20;
const VAT_TAX_TYPE_CODE = "0015";

export class HepsiFaturaError extends Error {
  code: string;
  details?: unknown;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HepsiFaturaError";
    this.code = code;
    this.details = details;
  }
}

export interface HepsiFaturaResult {
  ettn: string;
  invoiceNumber: string;
  pdfUrl: string;
  scenario: "einvoice" | "earchive" | string;
}

interface OrderForInvoice {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  email: string | null;
  paidAt: Date | null;
  createdAt: Date;
  user: { name: string | null; email: string | null; phone: string | null } | null;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    colorName: string | null;
    sizeName: string | null;
  }>;
  shippingAddress: {
    fullName: string | null;
    phone: string | null;
    fullAddress: string | null;
    district: { name: string | null; city: string | null } | null;
  } | null;
  billingAddress: {
    fullName: string | null;
    phone: string | null;
    fullAddress: string | null;
    district: { name: string | null; city: string | null } | null;
  } | null;
}

function formatDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatTimeStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.0000000+03:00`;
}

function buildSendInvoicePayload(
  order: OrderForInvoice,
  company: Record<string, unknown>,
  uuid: string,
) {
  const customer = order.billingAddress || order.shippingAddress;
  const customerName = customer?.fullName || order.user?.name || "Müşteri";
  const customerPhone = order.user?.phone || customer?.phone || "";
  const customerEmail = order.email || order.user?.email || "";
  const customerCity = customer?.district?.city || "İstanbul";
  const customerDistrict = customer?.district?.name || "";
  const customerAddress = customer?.fullAddress || "";

  const issueDate = new Date();
  const issueDateStr = formatDateStr(issueDate);
  const issueTimeStr = formatTimeStr(issueDate);

  const invoiceLines = order.items.map((item, idx) => {
    const grossTotal = item.totalPrice;
    const netAmount = grossTotal / (1 + VAT_RATE / 100);
    const taxAmount = grossTotal - netAmount;
    const unitPriceNet = netAmount / item.quantity;

    const variant = [item.colorName, item.sizeName].filter(Boolean).join(" / ");
    const desc = `Sipariş No: ${order.orderNumber} Satır No: ${idx + 1}${variant ? ` (${variant})` : ""}`;

    return {
      Id: { value: String(idx + 1) },
      InvoicedQuantity: { unitCode: "NIU", value: String(item.quantity) },
      LineExtensionAmount: { currencyId: "TRY", value: netAmount.toFixed(2) },
      TaxTotal: {
        TaxAmount: { currencyId: "TRY", value: taxAmount.toFixed(2) },
        TaxSubtotal: [
          {
            TaxableAmount: { currencyId: "TRY", value: netAmount.toFixed(2) },
            TaxAmount: { currencyId: "TRY", value: taxAmount.toFixed(2) },
            Percent: { value: String(VAT_RATE) },
            TaxCategory: {
              TaxScheme: {
                Name: { value: "KDV" },
                TaxTypeCode: { value: VAT_TAX_TYPE_CODE },
              },
            },
          },
        ],
      },
      Item: {
        Description: { value: desc },
        Name: { value: item.productName },
      },
      Price: {
        PriceAmount: { currencyId: "TRY", value: unitPriceNet.toFixed(2) },
      },
    };
  });

  const totalNet = invoiceLines.reduce(
    (sum, l) => sum + parseFloat(l.LineExtensionAmount.value),
    0,
  );
  const totalTax = invoiceLines.reduce(
    (sum, l) => sum + parseFloat(l.TaxTotal.TaxAmount.value),
    0,
  );
  const payableAmount = order.total;

  const companyVkn = String(company.taxNumber || "1063374910");
  const companyName = String(company.companyName || "Dark Velvet");
  const companyAddress = String(company.companyAddress || "");
  const companyTaxOffice = String(company.taxOffice || "");
  const companyPhone = String(company.phone || "");
  const companyTradeReg = String(company.tradeRegistryNo || "");
  const siteUrl = String(company.website || "https://www.dark-velvet.com");

  const turkishTotal =
    `*${payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TRY*`;

  return {
    Action: "SendInvoice",
    parameters: {
      invoices: [
        {
          Invoice: {
            UblVersionId: { value: 2.1 },
            CustomizationId: { value: "TR1.2" },
            ProfileId: { value: "EARSIVFATURA" },
            CopyIndicator: { value: false },
            UUID: { value: uuid },
            IssueDate: { value: issueDateStr },
            IssueTime: { value: issueTimeStr },
            InvoiceTypeCode: { value: "SATIS" },
            Note: [
              { value: `${order.orderNumber} nolu sipariş faturası` },
              { value: `Yalnız ${turkishTotal}` },
            ],
            DocumentCurrencyCode: { value: "TRY" },
            LineCountNumeric: { value: order.items.length },
            OrderReference: {
              Id: { value: order.orderNumber },
              IssueDate: { value: formatDateStr(order.paidAt || order.createdAt) },
            },
            AccountingSupplierParty: {
              Party: {
                PartyIdentification: [
                  { Id: { schemeId: "VKN", value: companyVkn } },
                  ...(companyTradeReg
                    ? [{ Id: { schemeId: "TICARETSICILNO", value: companyTradeReg } }]
                    : []),
                ],
                PartyName: { Name: { value: companyName } },
                PostalAddress: {
                  StreetName: { value: companyAddress },
                  CitySubdivisionName: { value: companyTaxOffice.split(" ")[0] || "" },
                  CityName: { value: "İstanbul" },
                  Country: { Name: { value: "Türkiye" } },
                },
                PartyTaxScheme: {
                  TaxScheme: { Name: { value: companyTaxOffice } },
                },
                Contact: {
                  Telephone: { value: companyPhone },
                  ElectronicMail: { value: String(company.email || "") },
                },
              },
            },
            AccountingCustomerParty: {
              Party: {
                PartyIdentification: [
                  { ID: { schemeID: "TCKN", Value: "11111111111" } },
                ],
                PartyName: { Name: { value: customerName } },
                PostalAddress: {
                  StreetName: { value: customerAddress },
                  CitySubdivisionName: { value: customerDistrict },
                  CityName: { value: customerCity },
                  Country: { Name: { value: "Türkiye" } },
                },
                Contact: {
                  Telephone: { value: customerPhone },
                  ElectronicMail: { value: customerEmail },
                },
              },
            },
            TaxTotal: [
              {
                TaxAmount: { currencyId: "TRY", value: totalTax.toFixed(2) },
                TaxSubtotal: [
                  {
                    TaxableAmount: { currencyId: "TRY", value: totalNet.toFixed(2) },
                    TaxAmount: { currencyId: "TRY", value: totalTax.toFixed(2) },
                    Percent: { value: VAT_RATE },
                    TaxCategory: {
                      TaxScheme: {
                        Name: { value: "KDV" },
                        TaxTypeCode: { value: VAT_TAX_TYPE_CODE },
                      },
                    },
                  },
                ],
              },
            ],
            LegalMonetaryTotal: {
              LineExtensionAmount: { currencyId: "TRY", value: totalNet.toFixed(2) },
              TaxExclusiveAmount: { currencyId: "TRY", value: totalNet.toFixed(2) },
              TaxInclusiveAmount: { currencyId: "TRY", value: payableAmount.toFixed(2) },
              PayableAmount: { currencyId: "TRY", value: payableAmount.toFixed(2) },
            },
            InvoiceLine: invoiceLines,
          },
          InvoiceInfo: {
            InvoiceScenarioChosen: "eArchive",
          },
          EArchiveInvoiceInfo: {
            DeliveryType: "Electronic",
            InternetSalesInfo: {
              WebAddress: siteUrl,
              PaymentType: "KREDIKARTI/BANKAKARTI",
              PaymentDate: formatDateStr(order.paidAt || order.createdAt),
            },
          },
          Notification: {
            Mailing: [
              {
                Subject: `${order.orderNumber} - e-Arşiv Faturanız`,
                EnableNotification: !!customerEmail,
                To: customerEmail || "",
                Attachment: { Xml: false, Pdf: true },
              },
            ],
          },
          LocalDocumentId: order.orderNumber,
        },
      ],
      userInfo: {
        Username: HEPSI_API_USER,
        Password: HEPSI_API_PASSWORD,
      },
    },
  };
}

/**
 * HepsiFatura (Hepsiburada e-Faturam) API üzerinden e-Arşiv fatura keser.
 * Dönen ETTN + fatura numarası + PDF görüntüleme linki.
 */
export async function sendEArchiveInvoice(orderId: string): Promise<HepsiFaturaResult> {
  if (!HEPSI_API_USER || !HEPSI_API_PASSWORD) {
    throw new HepsiFaturaError(
      "MISSING_CREDENTIALS",
      "HEPSIBURADA_API_USER veya HEPSIBURADA_API_PASSWORD tanımlı değil.",
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: {
        select: {
          id: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          colorName: true,
          sizeName: true,
        },
      },
      shippingAddress: { include: { district: true } },
      billingAddress: { include: { district: true } },
    },
  });

  if (!order) {
    throw new HepsiFaturaError("ORDER_NOT_FOUND", `Sipariş bulunamadı: ${orderId}`);
  }

  if (order.paymentStatus !== "PAID" && order.paymentStatus !== "SUCCEEDED") {
    throw new HepsiFaturaError(
      "ORDER_NOT_PAID",
      "Fatura yalnızca ödemesi tamamlanan siparişler için kesilir.",
    );
  }

  const existingEttn = (order as any).invoiceEttn;
  if (existingEttn) {
    return {
      ettn: existingEttn,
      invoiceNumber: "",
      pdfUrl: `${HEPSI_PORTAL_BASE}/Genel/Fatura/Goruntule/${existingEttn}/False`,
      scenario: "earchive",
    };
  }

  const companySettings = withDefaultCompanyProfile(await prisma.companySettings.findFirst());
  const uuid = randomUUID();
  const payload = buildSendInvoicePayload(
    order as unknown as OrderForInvoice,
    companySettings,
    uuid,
  );

  const endpoint = `${HEPSI_API_BASE}/api/BasicIntegrationApi`;

  let responseBody: any;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    responseBody = await res.json().catch(() => null);

    if (!res.ok) {
      throw new HepsiFaturaError(
        "HEPSI_HTTP_ERROR",
        `HepsiFatura API ${res.status}: ${responseBody?.Message || JSON.stringify(responseBody).slice(0, 300)}`,
        responseBody,
      );
    }
  } catch (err) {
    if (err instanceof HepsiFaturaError) throw err;
    throw new HepsiFaturaError(
      "HEPSI_FETCH_ERROR",
      `HepsiFatura API bağlantı hatası: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (responseBody?.IsSucceded === false || responseBody?.IsSuccessful === false) {
    throw new HepsiFaturaError(
      "HEPSI_BUSINESS_ERROR",
      responseBody.Message || responseBody.Errors?.[0] || "HepsiFatura iş hatası",
      responseBody,
    );
  }

  console.log(
    `[HepsiFatura] API yanıtı (orderId: ${orderId}):`,
    JSON.stringify(responseBody).slice(0, 500),
  );

  const invoiceValues = responseBody?.Value || responseBody?.Data?.Value || [];
  const valueList = Array.isArray(invoiceValues) ? invoiceValues : [invoiceValues];
  const first = valueList[0];

  const ettn =
    first?.UUID || first?.Id || first?.uuid || first?.id ||
    responseBody?.UUID || responseBody?.uuid ||
    uuid;
  const invoiceNumber =
    first?.Number || first?.InvoiceNumber || first?.DocumentNumber ||
    responseBody?.Number || "";
  const scenario = first?.InvoiceScenario || "earchive";

  const pdfUrl = `${HEPSI_PORTAL_BASE}/Genel/Fatura/Goruntule/${ettn}/False`;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        invoiceUrl: pdfUrl,
        invoiceEttn: ettn,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "HEPSI_FATURA_OLUSTURULDU",
        entityType: "ORDER",
        entityId: orderId,
        details: {
          ettn,
          invoiceNumber,
          pdfUrl,
          scenario,
          provider: "hepsiburada_efaturam",
        },
      },
    }),
  ]);

  const existingInvoiceRecord = await prisma.invoice.findFirst({
    where: { orderId },
    select: { id: true },
  });

  if (existingInvoiceRecord) {
    await prisma.invoice.update({
      where: { id: existingInvoiceRecord.id },
      data: { status: "ISSUED" },
    });
  }

  return { ettn, invoiceNumber, pdfUrl, scenario };
}
