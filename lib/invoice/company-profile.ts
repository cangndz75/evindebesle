type JsonObject = Record<string, unknown>;

export const DEFAULT_COMPANY_PROFILE = {
  companyName: "CIHAN MERT OZCAN",
  companyAddress: "YUNUS MAH. ERSIN SK NO:8/3 KARTAL ISTANBUL",
  taxOffice: "KARTAL VERGI DAIRESI MUD",
  taxNumber: "1063374910",
  phone: "5356818375",
  email: "info@dark-velvet.com",
  website: "https://www.dark-velvet.com",
  tradeRegistryNo: "6690628147",
} as const;

export function withDefaultCompanyProfile(source: unknown): JsonObject {
  if (!source || typeof source !== "object") {
    return { ...DEFAULT_COMPANY_PROFILE };
  }

  const obj = source as JsonObject;

  return {
    ...DEFAULT_COMPANY_PROFILE,
    ...obj,
    tradeRegistryNo:
      (obj.tradeRegistryNo as string | undefined) ||
      (obj.ticaretSicilNo as string | undefined) ||
      DEFAULT_COMPANY_PROFILE.tradeRegistryNo,
  };
}