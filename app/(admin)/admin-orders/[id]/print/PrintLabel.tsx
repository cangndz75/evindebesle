"use client";

import Barcode from "react-barcode";
import type { PrintOrder } from "@/lib/types/print-order";

type Props = { order: PrintOrder };

export function PrintLabel({ order }: Props) {
  return (
    <div className="print-container">
      <div className="label-header">
        <h2>Kargo Etiketi</h2>
      </div>
      <div className="barcode-section">
        {order.tracking_number ? (
          <Barcode value={order.tracking_number} format="CODE128" width={2} height={80} displayValue />
        ) : null}
      </div>
      <div className="address-section">
        <strong>Müşteri:</strong> {order.customer_name}
        <br />
        <strong>Adres:</strong> {order.shipping_address}
      </div>
      <div className="packing-slip">
        <h3>Paket İçeriği</h3>
        <table>
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Adet</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container,
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            background: #fff;
          }
        }
        .print-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 32px;
          font-family: Arial, sans-serif;
        }
        .barcode-section {
          margin: 24px 0;
          text-align: center;
        }
        .address-section {
          margin-bottom: 24px;
        }
        .packing-slip table {
          width: 100%;
          border-collapse: collapse;
        }
        .packing-slip th,
        .packing-slip td {
          border: 1px solid #333;
          padding: 8px;
          text-align: left;
        }
      `}</style>
    </div>
  );
}
