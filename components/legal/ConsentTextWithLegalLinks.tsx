"use client";

import { LegalTextLink, type LegalDocumentType } from "@/components/legal/LegalDocumentModal";

const TERMS_PHRASE = "Kullanım Koşullarını";
const PRIVACY_PHRASE = "Gizlilik Politikasını";

type Token =
  | { kind: "text"; value: string }
  | { kind: "terms" }
  | { kind: "privacy" };

function tokenizeConsentText(text: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const termsIdx = text.indexOf(TERMS_PHRASE, cursor);
    const privacyIdx = text.indexOf(PRIVACY_PHRASE, cursor);

    let nextIdx = -1;
    let kind: "terms" | "privacy" | null = null;

    if (termsIdx !== -1 && (privacyIdx === -1 || termsIdx <= privacyIdx)) {
      nextIdx = termsIdx;
      kind = "terms";
    } else if (privacyIdx !== -1) {
      nextIdx = privacyIdx;
      kind = "privacy";
    }

    if (nextIdx === -1) {
      if (cursor < text.length) {
        tokens.push({ kind: "text", value: text.slice(cursor) });
      }
      break;
    }

    if (nextIdx > cursor) {
      tokens.push({ kind: "text", value: text.slice(cursor, nextIdx) });
    }

    tokens.push({ kind: kind! });
    cursor =
      nextIdx + (kind === "terms" ? TERMS_PHRASE.length : PRIVACY_PHRASE.length);
  }

  return tokens;
}

export default function ConsentTextWithLegalLinks({
  text,
  onOpen,
}: {
  text: string;
  onOpen: (type: LegalDocumentType) => void;
}) {
  const tokens = tokenizeConsentText(text);

  const hasLegalLinks = tokens.some(
    (t) => t.kind === "terms" || t.kind === "privacy"
  );

  if (!hasLegalLinks) {
    return <span>{text}</span>;
  }

  return (
    <>
      {tokens.map((token, index) => {
        if (token.kind === "text") {
          return <span key={index}>{token.value}</span>;
        }
        if (token.kind === "terms") {
          return (
            <LegalTextLink key={index} type="terms" onOpen={onOpen}>
              {TERMS_PHRASE}
            </LegalTextLink>
          );
        }
        return (
          <LegalTextLink key={index} type="privacy" onOpen={onOpen}>
            {PRIVACY_PHRASE}
          </LegalTextLink>
        );
      })}
    </>
  );
}
