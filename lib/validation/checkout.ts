import { z } from 'zod';

export const CheckoutSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  address: z.object({
    street: z.string().min(2),
    city: z.string().min(2),
    state: z.string().min(2),
    zip: z.string().min(2),
  }),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })
  ).min(1),
  totalPrice: z.number().positive(),
  selectedCarrier: z.string().min(2),
});
