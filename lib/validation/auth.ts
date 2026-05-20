import { z } from "zod";

/** bcrypt DoS: yalnızca ilk 72 bayt işlenir; aşırı uzun parolalar CPU yükü oluşturur. */
export const passwordSchema = z
  .string({ error: "Şifre alanı zorunludur." })
  .min(8, "Şifre en az 8 karakter uzunluğunda olmalıdır.")
  .max(64, "Şifre çok uzun (maksimum 64 karakter).")
  .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir.")
  .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
  .regex(/[0-9]/, "Şifre en az bir rakam (0-9) içermelidir.")
  .regex(/[^a-zA-Z0-9]/, "Şifre en az bir özel karakter (@, #, !, ?, vb.) içermelidir.");

export const registerSchema = z.object({
  name: z
    .string({ error: "İsim alanı zorunludur." })
    .trim()
    .min(2, "İsim en az 2 karakter olmalıdır.")
    .max(50, "İsim en fazla 50 karakter olabilir."),
  email: z
    .string({ error: "E-posta alanı zorunludur." })
    .trim()
    .toLowerCase()
    .email("Geçerli bir e-posta adresi giriniz."),
  password: passwordSchema,
});

export const resetPasswordApiSchema = z.object({
  token: z.string().min(1, "Geçersiz veya eksik sıfırlama bağlantısı."),
  password: passwordSchema,
});

export const changePasswordApiSchema = z.object({
  current: z.string().min(1, "Mevcut şifre zorunludur."),
  next: passwordSchema,
});

export const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Şifre tekrarı zorunludur."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

export const changePasswordFormSchema = z
  .object({
    current: z.string().min(1, "Mevcut şifre zorunludur."),
    next: passwordSchema,
    confirm: z.string().min(1, "Şifre tekrarı zorunludur."),
  })
  .refine((data) => data.next === data.confirm, {
    message: "Yeni şifreler uyuşmuyor.",
    path: ["confirm"],
  });

export const PASSWORD_POLICY_HINT =
  "En az 8 karakter, bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter. Maksimum 64 karakter.";

export function getZodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz istek verisi.";
}
