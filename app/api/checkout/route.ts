
import { NextResponse } from 'next/server';

import { shipinkClient } from '@/lib/shipink';
import { CheckoutSchema } from '@/lib/validation/checkout';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parse = CheckoutSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ success: false, message: 'Geçersiz veri', errors: parse.error.flatten() }, { status: 400 });
    }
    const validBody = parse.data;
    const orderPayload = {
      customer: {
        name: validBody.customerName,
        email: { main: validBody.customerEmail },
        phone: { main: validBody.customerPhone },
        address: {
          street: validBody.address.street,
          city: validBody.address.city,
          state: validBody.address.state,
          zip: validBody.address.zip,
          country_code: 'TR',
        },
      },
      items: validBody.items,
      currency: 'TRY',
      price: validBody.totalPrice,
      payment: { method: 'credit-card', status: 'completed' },
    };
    const orderResponse = await shipinkClient.createOrder(orderPayload);
    const orderId = orderResponse.id;
    const shipmentPayload = {
      direction: 'outgoing',
      order_id: orderId,
      carrier_service_id: validBody.selectedCarrier,
      carrier_account_id: process.env.SHIPINK_CARRIER_ACCOUNT_ID,
      warehouse_id: process.env.SHIPINK_WAREHOUSE_ID,
      packages: [
        {
          dimension_unit: 'cm',
          height: 10,
          length: 10,
          width: 10,
          weight: 1,
          weight_unit: 'kg',
        },
      ],
    };
    const shipmentResponse = await shipinkClient.createShipment(shipmentPayload);

    // Shipink order ve shipment id'lerini veritabanına kaydet
    await prisma.order.create({
      data: {
        orderNumber: orderId,
        email: validBody.customerEmail,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        subtotal: validBody.totalPrice,
        shippingCost: 0,
        discount: 0,
        total: validBody.totalPrice,
        currency: 'TRY',
        trackingNumber: shipmentResponse.tracking_code || null,
        // userId, shippingAddressId, billingAddressId gibi alanları ihtiyaca göre doldurabilirsin
      }
    });

    return NextResponse.json(
      { success: true, order: orderResponse, shipment: shipmentResponse },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
