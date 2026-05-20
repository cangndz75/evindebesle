import Link from "next/link";
import type { CampaignDiscountTier } from "@/lib/campaign-banner";

const THEME_STYLES: Record<
  string,
  {
    gradient: string;
    border: string;
    accent: string;
    gold: string;
    cardBg: string;
    badgeDot: string;
  }
> = {
  olive: {
    gradient: "from-[#f8f5ef] to-[#ebdcc4]",
    border: "border-[#e2d5bd]",
    accent: "text-[#3d5a45]",
    gold: "text-[#bd9a5f]",
    cardBg: "bg-[#fcfaf5]",
    badgeDot: "bg-[#3d5a45]",
  },
  dark: {
    gradient: "from-[#1f1f1f] to-[#2d2d2d]",
    border: "border-[#3a3a3a]",
    accent: "text-[#e8dcc8]",
    gold: "text-[#c9a86a]",
    cardBg: "bg-[#2a2a2a]",
    badgeDot: "bg-[#c9a86a]",
  },
  velvet: {
    gradient: "from-[#2a1f2e] to-[#4a3548]",
    border: "border-[#5c4560]",
    accent: "text-[#f0e6f4]",
    gold: "text-[#d4a574]",
    cardBg: "bg-[#3d2f42]/80",
    badgeDot: "bg-[#d4a574]",
  },
};

export interface CampaignBannerProps {
  badgeText?: string | null;
  title: string;
  description?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  subNote?: string | null;
  discountTiers?: CampaignDiscountTier[];
  themeColor?: string;
}

export default function CampaignBanner({
  badgeText,
  title,
  description,
  buttonText,
  buttonUrl,
  subNote,
  discountTiers = [],
  themeColor = "olive",
}: CampaignBannerProps) {
  const theme = THEME_STYLES[themeColor] ?? THEME_STYLES.olive;
  const isDark = themeColor === "dark" || themeColor === "velvet";
  const titleLines = title.split("\n").filter(Boolean);

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div
        className={`relative flex flex-col lg:flex-row items-center justify-between p-8 lg:p-10 rounded-3xl bg-gradient-to-r ${theme.gradient} border ${theme.border} shadow-sm gap-8 overflow-hidden`}
      >
        <div className="flex-1 flex flex-col items-start text-left z-10">
          {badgeText && (
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 shadow-sm border ${
                isDark
                  ? "bg-white/10 backdrop-blur-sm border-white/20"
                  : "bg-white/70 backdrop-blur-sm border-white/50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${theme.badgeDot}`} />
              <span
                className={`text-[11px] font-bold tracking-widest uppercase ${theme.accent}`}
              >
                {badgeText}
              </span>
            </div>
          )}

          <h2
            className={`text-3xl lg:text-4xl uppercase leading-tight mb-4 tracking-tight ${
              isDark ? "text-white" : "text-[#1a1a1a]"
            }`}
          >
            {titleLines.map((line, i) => (
              <span
                key={i}
                className={
                  i === 0
                    ? "block font-extrabold"
                    : "block italic font-serif font-medium"
                }
              >
                {line}
              </span>
            ))}
          </h2>

          {description && (
            <p
              className={`text-sm lg:text-base max-w-md leading-relaxed mb-8 ${
                isDark ? "text-white/80" : "text-gray-700"
              }`}
            >
              {description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {buttonText && buttonUrl && (
              <Link
                href={buttonUrl}
                className={`${
                  isDark ? "bg-[#c9a86a] text-[#1a1a1a]" : "bg-[#3d5a45] text-white"
                } px-8 py-3.5 rounded-full font-semibold text-sm transition-transform hover:scale-105 active:scale-95 shadow-md`}
              >
                {buttonText}
              </Link>
            )}
            {subNote && (
              <span
                className={`text-xs font-medium ${
                  isDark ? "text-white/60" : "text-gray-600"
                }`}
              >
                {subNote}
              </span>
            )}
          </div>
        </div>

        {discountTiers.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 z-10">
            {discountTiers.map((tier, index) => {
              const isAmount = tier.discountType === "AMOUNT";
              return (
                <div
                  key={`${tier.threshold}-${index}`}
                  className={`${theme.cardBg} rounded-2xl p-6 flex flex-col items-center justify-center min-w-[140px] shadow-sm border ${
                    isDark ? "border-white/10" : "border-white/60"
                  } transition-transform hover:-translate-y-1`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                      isDark ? "text-white/50" : "text-gray-500"
                    }`}
                  >
                    {tier.threshold} TL ÜZERİ
                  </span>
                  <div className={`flex items-start ${theme.accent}`}>
                    {isAmount ? (
                      <span className="text-4xl font-black leading-none">
                        {tier.discount}
                        <span className="text-lg font-bold ml-0.5">TL</span>
                      </span>
                    ) : (
                      <>
                        <span className="text-3xl font-black">%</span>
                        <span className="text-5xl font-black leading-none">
                          {tier.discount}
                        </span>
                      </>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${theme.gold}`}
                  >
                    İNDİRİM
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="absolute top-0 right-0 w-96 h-96 bg-white/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      </div>
    </div>
  );
}
