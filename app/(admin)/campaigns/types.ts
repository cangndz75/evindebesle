// Kampanya ve blok tipleri

export type CampaignStatus = "draft" | "ready" | "scheduled" | "sent";

export interface CampaignDraft {
  id: string | null;
  name: string;
  status: CampaignStatus;
  subject: string;
  preheader: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  blocks: Block[];
  audienceSegmentId: string | null;
  scheduleAt: Date | null;
}

export type BlockType = "header" | "hero" | "coupon" | "cta" | "footer" | "text" | "product" | "image" | "divider";

export interface Block {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  style: Record<string, any>;
  visibility: {
    mobile: boolean;
    desktop: boolean;
  };
}

export interface Variable {
  key: string;
  label: string;
  fallback: string;
  exampleValue: string;
  category: "standard" | "campaign";
}

export interface PreviewUser {
  id: string;
  name: string;
  variables: Record<string, string>;
}
