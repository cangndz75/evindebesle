import { DEFAULT_COMPANY_PROFILE } from "@/lib/invoice/company-profile";

const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.hepsiburadaefaturam.com/api/BasicIntegrationApi"
    : "https://testapi.hepsiburadaefaturam.com/api/BasicIntegrationApi";

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface OrderData {
  orderId: string;
  issueDate: string;
  issueTime: string;
  customerName: string;
  customerSurname: string;
  customerEmail: string;
  customerPhone: string;
  customerTckn: string;
  customerCity: string;
  customerDistrict: string;
  customerAddress: string;
  items: OrderItem[];
}

interface TaxSubtotalEntry {
  TaxableAmount: { currencyId: string; value: string };
  TaxAmount: { currencyId: string; value: string };
  Percent: { value: number };
  TaxCategory: {
    TaxScheme: { Name: { value: string }; TaxTypeCode: { value: string } };
  };
}

interface InvoiceLine {
  Id: { value: string };
  InvoicedQuantity: { unitCode: string; value: string };
  LineExtensionAmount: { currencyId: string; value: string };
  TaxTotal: {
    TaxAmount: { currencyId: string; value: string };
    TaxSubtotal: TaxSubtotalEntry[];
  };
  Item: { Name: { value: string }; ModelName: { value: string } };
  Price: { PriceAmount: { currencyId: string; value: string } };
}

function buildInvoiceLines(items: OrderItem[]): {
  lines: InvoiceLine[];
  totalTaxExclusive: number;
  totalTaxAmount: number;
} {
  let totalTaxExclusive = 0;
  let totalTaxAmount = 0;

  const lines: InvoiceLine[] = items.map((item, index) => {
    const lineExtensionAmount = item.unitPrice * item.quantity;
    const taxAmount = lineExtensionAmount * (item.taxRate / 100);

    totalTaxExclusive += lineExtensionAmount;
    totalTaxAmount += taxAmount;

    return {
      Id: { value: (index + 1).toString() },
      InvoicedQuantity: { unitCode: "NIU", value: item.quantity.toString() },
      LineExtensionAmount: {
        currencyId: "TRY",
        value: lineExtensionAmount.toFixed(2),
      },
      TaxTotal: {
        TaxAmount: { currencyId: "TRY", value: taxAmount.toFixed(2) },
        TaxSubtotal: [
          {
            TaxableAmount: {
              currencyId: "TRY",
              value: lineExtensionAmount.toFixed(2),
            },
            TaxAmount: { currencyId: "TRY", value: taxAmount.toFixed(2) },
            Percent: { value: item.taxRate },
            TaxCategory: {
              TaxScheme: {
                Name: { value: "KDV" },
                TaxTypeCode: { value: "0015" },
              },
            },
          },
        ],
      },
      Item: { Name: { value: item.name }, ModelName: { value: item.sku } },
      Price: {
        PriceAmount: { currencyId: "TRY", value: item.unitPrice.toFixed(2) },
      },
    };
  });

  return { lines, totalTaxExclusive, totalTaxAmount };
}

function groupTaxSubtotals(lines: InvoiceLine[]): TaxSubtotalEntry[] {
  const grouped = new Map<number, { taxable: number; tax: number }>();

  for (const line of lines) {
    for (const sub of line.TaxTotal.TaxSubtotal) {
      const rate = sub.Percent.value;
      const existing = grouped.get(rate) ?? { taxable: 0, tax: 0 };
      existing.taxable += parseFloat(sub.TaxableAmount.value);
      existing.tax += parseFloat(sub.TaxAmount.value);
      grouped.set(rate, existing);
    }
  }

  return Array.from(grouped.entries()).map(([rate, totals]) => ({
    TaxableAmount: { currencyId: "TRY", value: totals.taxable.toFixed(2) },
    TaxAmount: { currencyId: "TRY", value: totals.tax.toFixed(2) },
    Percent: { value: rate },
    TaxCategory: {
      TaxScheme: { Name: { value: "KDV" }, TaxTypeCode: { value: "0015" } },
    },
  }));
}

export async function createEInvoice(orderData: OrderData) {
  const { lines, totalTaxExclusive, totalTaxAmount } = buildInvoiceLines(
    orderData.items
  );
  const payableAmount = totalTaxExclusive + totalTaxAmount;

  const payload = {
    Action: "SendInvoice",
    parameters: {
      invoices: [
        {
          Invoice: {
            UblVersionId: { value: 2.1 },
            CustomizationId: { value: "TR1.2" },
            ProfileId: { value: "EARSIVFATURA" },
            CopyIndicator: { value: false },
            IssueDate: { value: orderData.issueDate },
            IssueTime: { value: orderData.issueTime },
            InvoiceTypeCode: { value: "SATIS" },
            DocumentCurrencyCode: { value: "TRY" },
            LineCountNumeric: { value: lines.length },
            OrderReference: {
              Id: { value: orderData.orderId },
              IssueDate: { value: orderData.issueDate },
            },
            AccountingSupplierParty: {
              Party: {
                PartyIdentification: [
                  {
                    Id: {
                      schemeId: "VKN",
                      value: DEFAULT_COMPANY_PROFILE.taxNumber,
                    },
                  },
                ],
                PartyName: {
                  Name: { value: DEFAULT_COMPANY_PROFILE.companyName },
                },
              },
            },
            AccountingCustomerParty: {
              Party: {
                PartyIdentification: [
                  {
                    ID: { schemeID: "TCKN", Value: orderData.customerTckn },
                  },
                ],
                PostalAddress: {
                  StreetName: { value: orderData.customerAddress },
                  CitySubdivisionName: { value: orderData.customerDistrict },
                  CityName: { value: orderData.customerCity },
                  Country: { Name: { value: "Türkiye" } },
                },
                Contact: {
                  Telephone: { value: orderData.customerPhone },
                  ElectronicMail: { value: orderData.customerEmail },
                },
                Person: {
                  FirstName: { value: orderData.customerName },
                  FamilyName: { value: orderData.customerSurname },
                },
              },
            },
            TaxTotal: [
              {
                TaxAmount: {
                  currencyId: "TRY",
                  value: totalTaxAmount.toFixed(2),
                },
                TaxSubtotal: groupTaxSubtotals(lines),
              },
            ],
            LegalMonetaryTotal: {
              LineExtensionAmount: {
                currencyId: "TRY",
                value: totalTaxExclusive.toFixed(2),
              },
              TaxExclusiveAmount: {
                currencyId: "TRY",
                value: totalTaxExclusive.toFixed(2),
              },
              TaxInclusiveAmount: {
                currencyId: "TRY",
                value: payableAmount.toFixed(2),
              },
              PayableAmount: {
                currencyId: "TRY",
                value: payableAmount.toFixed(2),
              },
            },
            InvoiceLine: lines,
          },
          EArchiveInvoiceInfo: { DeliveryType: "Electronic" },
          Scenario: 0,
          Notification: {
            Mailing: [
              {
                Subject: `Dark Velvet - ${orderData.orderId} Nolu Sipariş Faturanız`,
                EnableNotification: true,
                To: orderData.customerEmail,
                Attachment: { Xml: false, Pdf: true },
              },
            ],
          },
          LocalDocumentId: `DV-${orderData.orderId}`,
        },
      ],
      userInfo: {
        Username: process.env.HEPSIBURADA_API_USER,
        Password: process.env.HEPSIBURADA_API_PASSWORD,
      },
    },
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `e-Fatura oluşturulamadı. Status: ${response.status} - ${errorBody}`
    );
  }

  return response.json();
}
