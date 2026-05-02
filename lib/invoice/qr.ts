type AnyRecord = Record<string, unknown>;

function readString(source: unknown, keys: string[]): string | null {
  if (!source || typeof source !== "object") return null;
  const obj = source as AnyRecord;

  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function normalizeEttn(value: string | null | undefined): string {
  if (!value) return "";
  return value.replaceAll("-", "").trim();
}

export function resolveInvoiceEttn(input: {
  invoiceId?: string | null;
  customerDetails?: unknown;
  companyDetails?: unknown;
}): string {
  const fromCustomer = readString(input.customerDetails, ["ettn", "ETTN"]);
  const fromCompany = readString(input.companyDetails, ["ettn", "ETTN"]);
  const fromId = input.invoiceId || "";

  return normalizeEttn(fromCustomer || fromCompany || fromId);
}

export function formatQrIssueDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildGibQrContent(params: {
  sellerTaxId: string;
  invoiceNumber: string;
  ettn: string;
  issueDate: string;
  payableAmount: number;
}): string {
  return [
    params.sellerTaxId,
    params.invoiceNumber,
    params.ettn,
    params.issueDate,
    params.payableAmount.toFixed(2),
  ].join("|");
}