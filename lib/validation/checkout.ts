import { z } from 'zod';

const AddressSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  addressLine1: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
}).optional();

const CartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  colorId: z.string().optional().nullable(),
  sizeId: z.string().optional().nullable(),
  colorName: z.string().optional().nullable(),
  sizeName: z.string().optional().nullable(),
});

export const CheckoutSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin."),
  items: z.array(CartItemSchema).min(1, "Sepette en az bir ürün olmalıdır."),
  billingAddress: AddressSchema,
  shippingAddress: AddressSchema,
  selectedUserAddressId: z.string().optional().nullable(),
  paymentMethod: z.enum(["CREDIT_CARD", "TEST"]).default("CREDIT_CARD"),
  couponCode: z.string().optional().nullable(),
  acceptDistanceSalesContract: z.literal(true, {
    errorMap: () => ({ message: "Mesafeli satış sözleşmesini onaylamanız gerekir." }),
  }),
  userId: z.string().optional().nullable(),
  newsletterConsent: z.boolean().optional(),
});
