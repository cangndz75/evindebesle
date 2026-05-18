import { Button, Section, Text } from "@react-email/components";
import { EmailShell } from "../EmailShell";
import type { AbandonedCheckoutReminderPayload } from "../types";

const subtle = "#52525b";
const boxBg = "#fafafa";

export default function AbandonedCheckoutReminderEmail({
  checkoutUrl,
  couponCode,
  orderIdShort,
}: AbandonedCheckoutReminderPayload) {
  const preview = "Sepetiniz sizi bekliyor — kısa bir hatırlatma";

  return (
    <EmailShell preview={preview}>
      <Section style={{ padding: "28px 28px 8px" }}>
        <Text
          style={{
            margin: "0 0 10px",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#18181b",
          }}
        >
          Alışverişiniz yarım kaldı
        </Text>
        <Text style={{ margin: "0 0 22px", fontSize: 15, lineHeight: 1.65, color: subtle }}>
          Seçtiğiniz parçalar hâlâ sizin için ayrıldı. Ödemeyi birkaç dakikada tamamlayarak koleksiyona
          geri dönebilirsiniz.
        </Text>

        <Section
          style={{
            marginBottom: 22,
            padding: "18px 16px",
            backgroundColor: boxBg,
            border: "1px solid #e4e4e7",
            borderRadius: 10,
            textAlign: "center",
          }}
        >
          <Text
            style={{
              margin: "0 0 6px",
              fontSize: 11,
              fontWeight: 600,
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Tek seferlik kod
          </Text>
          <Text
            style={{
              margin: "0 0 8px",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.04em",
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: "#18181b",
            }}
          >
            {couponCode}
          </Text>
          <Text style={{ margin: 0, fontSize: 13, color: subtle }}>Ödeme adımında uygulayın — %10 indirim</Text>
        </Section>

        <Section style={{ textAlign: "center", marginBottom: 22 }}>
          <Button
            href={checkoutUrl}
            style={{
              display: "inline-block",
              padding: "14px 28px",
              backgroundColor: "#18181b",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Ödemeye devam et
          </Button>
        </Section>

        {orderIdShort ? (
          <Text style={{ margin: "0 0 16px", fontSize: 12, color: "#a1a1aa", textAlign: "center" }}>
            Referans: {orderIdShort}
          </Text>
        ) : null}

        <Text style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: subtle }}>
          Bu e-postayı, ödeme tamamlanmadan ayrıldığınız bir sipariş için alıyorsunuz. Kod süresi
          sınırlıdır; kullanılamazsa yeni bir sipariş oluşturabilirsiniz.
        </Text>
      </Section>
    </EmailShell>
  );
}
