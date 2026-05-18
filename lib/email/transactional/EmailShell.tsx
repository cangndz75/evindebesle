import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const page = {
  bg: "#fafafa",
  border: "#e4e4e7",
  text: "#18181b",
  muted: "#71717a",
  faint: "#a1a1aa",
};

type EmailShellProps = {
  preview: string;
  children: ReactNode;
};

/**
 * Tüm transaksiyonel maillerde ortak çerçeve: sınır, nötr tipografi, ince footer.
 */
export function EmailShell({ preview, children }: EmailShellProps) {
  const year = new Date().getFullYear();

  return (
    <Html lang="tr">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: page.bg,
          margin: 0,
          padding: "32px 16px",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <Container
          style={{
            maxWidth: 600,
            margin: "0 auto",
            backgroundColor: "#ffffff",
            border: `1px solid ${page.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <Section
            style={{
              padding: "22px 28px",
              borderBottom: `1px solid ${page.border}`,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: page.text,
              }}
            >
              Dark Velvet
            </Text>
          </Section>
          {children}
          <Section style={{ padding: "20px 28px 28px" }}>
            <Hr style={{ borderColor: page.border, margin: "0 0 18px" }} />
            <Text
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.55,
                color: page.muted,
                textAlign: "center",
              }}
            >
              Bu ileti hesabınızla ilgili bir işlem bildirimidir. Destek için mağazamızdaki iletişim
              kanallarını kullanabilirsiniz.
            </Text>
            <Text
              style={{
                margin: "14px 0 0",
                fontSize: 11,
                color: page.faint,
                textAlign: "center",
              }}
            >
              © {year} Dark Velvet
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
