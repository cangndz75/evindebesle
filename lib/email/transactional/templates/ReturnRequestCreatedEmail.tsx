import { Button, Section, Text } from "@react-email/components";
import { EmailShell } from "../EmailShell";
import type { ReturnRequestCreatedPayload } from "../types";

const subtle = "#52525b";
const boxBg = "#fafafa";

export default function ReturnRequestCreatedEmail({
  orderNumber,
  carrierName,
  trackingCode,
  pdfUrl,
  trackingUrl,
}: ReturnRequestCreatedPayload) {
  const preview = `İade talebiniz — Sipariş ${orderNumber}`;

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
          İade talebiniz alındı
        </Text>
        <Text style={{ margin: "0 0 20px", fontSize: 15, lineHeight: 1.6, color: subtle }}>
          <strong style={{ color: "#18181b" }}>{orderNumber}</strong> numaralı sipariş için iade kaydınız
          oluşturuldu. Paketi kargoya verirken aşağıdaki bilgileri kullanabilirsiniz.
        </Text>

        <Section
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            backgroundColor: boxBg,
            border: "1px solid #e4e4e7",
            borderRadius: 10,
          }}
        >
          <Text style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Taşıyıcı
          </Text>
          <Text style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "#18181b" }}>{carrierName}</Text>
        </Section>

        {trackingCode ? (
          <Section
            style={{
              marginBottom: 24,
              padding: "20px 18px",
              textAlign: "center",
              backgroundColor: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                margin: "0 0 10px",
                fontSize: 11,
                fontWeight: 600,
                color: "#71717a",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              İade kargo kodu
            </Text>
            <Text
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                color: "#18181b",
                wordBreak: "break-all",
              }}
            >
              {trackingCode}
            </Text>
          </Section>
        ) : null}

        <Section style={{ textAlign: "center", marginBottom: 8 }}>
          {pdfUrl ? (
            <Button
              href={pdfUrl}
              style={{
                display: "inline-block",
                margin: "0 8px 10px 0",
                padding: "12px 22px",
                backgroundColor: "#18181b",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              İade etiketini indir
            </Button>
          ) : null}
          {trackingUrl ? (
            <Button
              href={trackingUrl}
              style={{
                display: "inline-block",
                margin: "0 0 10px 8px",
                padding: "12px 22px",
                backgroundColor: "#ffffff",
                color: "#18181b",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                textDecoration: "none",
                border: "1px solid #d4d4d8",
              }}
            >
              Kargoyu takip et
            </Button>
          ) : null}
        </Section>

        <Text style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: subtle }}>
          Etiketi yazdırıp pakete yapıştırabilir veya şubede kargo kodunu iletebilirsiniz. Ürün depomuza
          ulaştığında inceleme süreci başlar; onay sonrası ücret iadesi kartınıza yansır.
        </Text>
      </Section>
    </EmailShell>
  );
}
