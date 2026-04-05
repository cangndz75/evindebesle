const SSL_MODE_ALIASES = new Set(["prefer", "require", "verify-ca"]);

export function normalizeDatabaseUrlForPg(connectionString) {
  if (!connectionString) {
    return connectionString;
  }

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
    const useLibpqCompat =
      url.searchParams.get("uselibpqcompat")?.toLowerCase() === "true";

    if (!sslMode || useLibpqCompat || !SSL_MODE_ALIASES.has(sslMode)) {
      return connectionString;
    }

    url.searchParams.set("sslmode", "verify-full");
    return url.toString();
  } catch {
    return connectionString;
  }
}