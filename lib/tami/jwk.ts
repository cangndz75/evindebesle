export function getJwkResource() {
  const kid = (process.env.TAMI_FIXED_KID_VALUE || "").trim();
  const k = (process.env.TAMI_FIXED_K_VALUE || "").trim();

  if (!kid || !k) {
    throw new Error("Missing TAMI_FIXED_KID_VALUE or TAMI_FIXED_K_VALUE");
  }

  const jwk = { kty: "oct", use: "sig", kid, k, alg: "HS512" };
  console.log("[DEBUG TAMI JWK]", jwk);
  return jwk;
}