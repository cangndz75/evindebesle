import "server-only";

import { render } from "@react-email/render";
import type { RenderedTransactionalEmail, TransactionalEmailInput } from "./types";
import ReturnRequestCreatedEmail from "./templates/ReturnRequestCreatedEmail";
import AbandonedCheckoutReminderEmail from "./templates/AbandonedCheckoutReminderEmail";

/**
 * Transaksiyonel e-postayı React Email ile HTML + konu başlığına dönüştürür.
 * Yeni tür: `types.ts` + şablon + bu switch'e satır ekleyin.
 */
export async function renderTransactionalEmail(
  input: TransactionalEmailInput
): Promise<RenderedTransactionalEmail> {
  switch (input.type) {
    case "RETURN_REQUEST_CREATED": {
      const html = await render(<ReturnRequestCreatedEmail {...input.payload} />);
      return {
        subject: `İade talebiniz — ${input.payload.orderNumber}`,
        html,
      };
    }
    case "ABANDONED_CHECKOUT_REMINDER": {
      const html = await render(<AbandonedCheckoutReminderEmail {...input.payload} />);
      return {
        subject: "Ödemeniz bekleniyor — sepetiniz açık",
        html,
      };
    }
  }
}
