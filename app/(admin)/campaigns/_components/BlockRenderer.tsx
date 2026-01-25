"use client";

import { Block } from "../types";
import HeaderBlock from "./blocks/HeaderBlock";
import HeroBlock from "./blocks/HeroBlock";
import CouponBlock from "./blocks/CouponBlock";
import CtaBlock from "./blocks/CtaBlock";
import TextBlock from "./blocks/TextBlock";
import FooterBlock from "./blocks/FooterBlock";
import ProductBlock from "./blocks/ProductBlock";
import ImageBlock from "./blocks/ImageBlock";
import DividerBlock from "./blocks/DividerBlock";

interface BlockRendererProps {
  block: Block;
  onUpdate?: (updates: Partial<Block>) => void;
}

export default function BlockRenderer({ block, onUpdate }: BlockRendererProps) {
  switch (block.type) {
    case "header":
      return <HeaderBlock block={block} />;
    case "hero":
      return <HeroBlock block={block} />;
    case "coupon":
      return <CouponBlock block={block} />;
    case "cta":
      return <CtaBlock block={block} />;
    case "text":
      return <TextBlock block={block} />;
    case "footer":
      return <FooterBlock block={block} />;
    case "product":
      return <ProductBlock block={block} />;
    case "image":
      return <ImageBlock block={block} onUpdate={onUpdate} />;
    case "divider":
      return <DividerBlock block={block} />;
    default:
      return <div className="p-4 text-gray-500">Bilinmeyen blok tipi</div>;
  }
}

