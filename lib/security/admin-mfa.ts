import "server-only";

import { prisma } from "@/lib/db";
import { decryptAtRest, encryptAtRest } from "@/lib/security/at-rest-crypto";
import {
  buildOtpAuthUri,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  verifyTotpToken,
} from "@/lib/security/totp";

type BackupCodePayload = {
  hashes: string[];
};

function parseBackupPayload(raw: string | null | undefined): BackupCodePayload {
  if (!raw) return { hashes: [] };
  try {
    const text = decryptAtRest(raw) || "";
    const parsed = JSON.parse(text) as BackupCodePayload;
    if (!Array.isArray(parsed.hashes)) return { hashes: [] };
    return { hashes: parsed.hashes.filter((x) => typeof x === "string") };
  } catch {
    return { hashes: [] };
  }
}

function encodeBackupPayload(payload: BackupCodePayload): string {
  return encryptAtRest(JSON.stringify(payload));
}

export async function getAdminMfaStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isAdmin: true,
      adminMfaEnabled: true,
      adminMfaEnabledAt: true,
      adminMfaBackupCodes: true,
    },
  });

  if (!user || !user.isAdmin) {
    return null;
  }

  const backup = parseBackupPayload(user.adminMfaBackupCodes);

  return {
    enabled: Boolean(user.adminMfaEnabled),
    enabledAt: user.adminMfaEnabledAt,
    backupCodesRemaining: backup.hashes.length,
  };
}

export async function setupAdminMfa(userId: string, email: string) {
  const secret = generateTotpSecret();
  const otpauthUri = buildOtpAuthUri(email, secret);

  await prisma.user.update({
    where: { id: userId },
    data: {
      adminMfaSecret: encryptAtRest(secret),
      adminMfaEnabled: false,
      adminMfaEnabledAt: null,
      adminMfaBackupCodes: null,
    },
  });

  return { secret, otpauthUri };
}

export async function enableAdminMfa(userId: string, otp: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isAdmin: true,
      adminMfaSecret: true,
    },
  });

  if (!user || !user.isAdmin || !user.adminMfaSecret) {
    return { ok: false as const, error: "MFA_SETUP_REQUIRED" };
  }

  const secret = decryptAtRest(user.adminMfaSecret);
  if (!secret || !verifyTotpToken(secret, otp)) {
    return { ok: false as const, error: "INVALID_OTP" };
  }

  const backupCodes = generateBackupCodes(8);
  const payload: BackupCodePayload = { hashes: backupCodes.map(hashBackupCode) };

  await prisma.user.update({
    where: { id: userId },
    data: {
      adminMfaEnabled: true,
      adminMfaEnabledAt: new Date(),
      adminMfaBackupCodes: encodeBackupPayload(payload),
    },
  });

  return { ok: true as const, backupCodes };
}

export async function disableAdminMfa(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      adminMfaEnabled: false,
      adminMfaEnabledAt: null,
      adminMfaSecret: null,
      adminMfaBackupCodes: null,
    },
  });
}

export async function verifyAdminMfaLogin(userId: string, otpOrBackupCode: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      adminMfaEnabled: true,
      adminMfaSecret: true,
      adminMfaBackupCodes: true,
    },
  });

  if (!user?.adminMfaEnabled) {
    return { ok: false as const, reason: "MFA_DISABLED" };
  }

  const secret = decryptAtRest(user.adminMfaSecret || null);
  if (secret && verifyTotpToken(secret, otpOrBackupCode)) {
    return { ok: true as const };
  }

  const backup = parseBackupPayload(user.adminMfaBackupCodes);
  const inputHash = hashBackupCode(otpOrBackupCode);
  const idx = backup.hashes.indexOf(inputHash);
  if (idx < 0) {
    return { ok: false as const, reason: "INVALID_OTP" };
  }

  backup.hashes.splice(idx, 1);
  await prisma.user.update({
    where: { id: userId },
    data: {
      adminMfaBackupCodes: encodeBackupPayload(backup),
    },
  });

  return { ok: true as const, usedBackupCode: true as const };
}
