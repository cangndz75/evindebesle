import { Block } from "@/app/(admin)/campaigns/types";

interface RenderOptions {
  baseUrl: string;
  trackingId?: string;
  campaignId?: string;
}

export function renderEmailHtml(blocks: Block[], options: RenderOptions): string {
  const { baseUrl, trackingId, campaignId } = options;

  const bodyContent = blocks
    .map((block) => renderBlock(block, options))
    .join("\n");

  const trackingPixel = trackingId
    ? `<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`
    : "";

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      background-color: #f4f4f4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    a {
      color: #000000;
      text-decoration: none;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff;">
          ${bodyContent}
        </table>
      </td>
    </tr>
  </table>
  ${trackingPixel}
</body>
</html>
  `.trim();
}

function renderBlock(block: Block, options: RenderOptions): string {
  switch (block.type) {
    case "header":
      return renderHeaderBlock(block);
    case "hero":
      return renderHeroBlock(block, options);
    case "text":
      return renderTextBlock(block);
    case "coupon":
      return renderCouponBlock(block);
    case "cta":
      return renderCtaBlock(block, options);
    case "product":
      return renderProductBlock(block, options);
    case "image":
      return renderImageBlock(block, options);
    case "divider":
      return renderDividerBlock(block);
    case "footer":
      return renderFooterBlock(block, options);
    default:
      return "";
  }
}

function renderHeaderBlock(block: Block): string {
  const bgColor = block.style.backgroundColor || "#ffffff";
  const logoUrl = block.content.logoUrl || "";
  const siteName = block.content.siteName || "";

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: 20px; text-align: center;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${siteName}" style="max-height: 60px; width: auto;" />` : ""}
        ${!logoUrl && siteName ? `<h1 style="margin: 0; font-size: 24px; font-weight: bold;">${siteName}</h1>` : ""}
      </td>
    </tr>
  `;
}

function renderHeroBlock(block: Block, options: RenderOptions): string {
  const bgColor = block.style.backgroundColor || "#f9fafb";
  const imageUrl = block.content.imageUrl || "";
  const greeting = block.content.greeting || "";
  const message = block.content.message || "";
  const description = block.content.description || "";

  return `
    <tr>
      <td style="background-color: ${bgColor};">
        ${imageUrl ? `<img src="${imageUrl}" alt="Hero" style="width: 100%; height: auto; display: block;" />` : ""}
        <div style="padding: 32px; text-align: center;">
          ${message ? `<p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">${message}</p>` : ""}
          ${greeting ? `<h2 style="margin: 0 0 16px; font-size: 28px; font-weight: bold; color: #111827;">${greeting}</h2>` : ""}
          ${description ? `<p style="margin: 0; font-size: 16px; color: #374151;">${description}</p>` : ""}
        </div>
      </td>
    </tr>
  `;
}

function renderTextBlock(block: Block): string {
  const bgColor = block.style.backgroundColor || "#ffffff";
  const textColor = block.style.textColor || "#374151";
  const text = block.content.text || "";
  const fontSize = block.style.fontSize || 16;

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: 24px 32px;">
        <p style="margin: 0; font-size: ${fontSize}px; color: ${textColor}; line-height: 1.6;">
          ${text.replace(/\n/g, "<br />")}
        </p>
      </td>
    </tr>
  `;
}

function renderCouponBlock(block: Block): string {
  const bgColor = block.style.backgroundColor || "#ffffff";
  const borderColor = block.style.borderColor || "#000000";
  const couponCode = block.content.couponCode || "";
  const discountText = block.content.discountText || "";
  const validityText = block.content.validityText || "";

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: 32px; text-align: center;">
        <div style="display: inline-block; border: 2px dashed ${borderColor}; padding: 24px 48px; border-radius: 8px;">
          ${discountText ? `<p style="margin: 0 0 8px; font-size: 18px; font-weight: bold; color: ${borderColor};">${discountText}</p>` : ""}
          <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">İndirim Kodu</p>
          <p style="margin: 0 0 12px; font-size: 28px; font-family: monospace; font-weight: bold; color: ${borderColor}; background-color: #f3f4f6; padding: 8px 16px; border-radius: 4px;">
            ${couponCode}
          </p>
          ${validityText ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${validityText}</p>` : ""}
        </div>
      </td>
    </tr>
  `;
}

function renderCtaBlock(block: Block, options: RenderOptions): string {
  const bgColor = block.style.backgroundColor || "#ffffff";
  const buttonColor = block.style.buttonColor || "#000000";
  const buttonTextColor = block.style.buttonTextColor || "#ffffff";
  const text = block.content.buttonText || "Tıkla";
  let url = block.content.linkUrl || "#";

  if (options.campaignId && url !== "#") {
    url = `${options.baseUrl}/api/track/click?campaignId=${options.campaignId}&url=${encodeURIComponent(url)}`;
  }

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: 24px 32px; text-align: center;">
        <a href="${url}" class="button" style="display: inline-block; background-color: ${buttonColor}; color: ${buttonTextColor}; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
          ${text}
        </a>
      </td>
    </tr>
  `;
}

function renderProductBlock(block: Block, options: RenderOptions): string {
  const bgColor = block.style.backgroundColor || "#ffffff";
  const buttonColor = block.style.buttonColor || "#000000";
  const products = block.content.products || [];
  const columns = block.content.columns || 3;
  const showPrices = block.content.showPrices !== false;
  const showButton = block.content.showButton !== false;
  const buttonText = block.content.buttonText || "Sepete Ekle";

  if (products.length === 0) return "";

  const productWidth = Math.floor(100 / columns);

  const productCells = products
    .map((product: { id: string; name: string; price: number; originalPrice?: number; image?: string; slug?: string }) => {
      const productUrl = product.slug
        ? `${options.baseUrl}/product/${product.slug}`
        : "#";

      return `
        <td style="width: ${productWidth}%; padding: 8px; vertical-align: top;">
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            ${product.image ? `<a href="${productUrl}"><img src="${product.image}" alt="${product.name}" style="width: 100%; height: auto; display: block;" /></a>` : ""}
            <div style="padding: 12px;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 500; color: #111827;">${product.name}</p>
              ${showPrices ? `
                <p style="margin: 0 0 8px;">
                  <span style="font-size: 14px; font-weight: bold; color: #111827;">${product.price.toLocaleString("tr-TR")} TL</span>
                  ${product.originalPrice && product.originalPrice > product.price ? `<span style="font-size: 12px; color: #6b7280; text-decoration: line-through; margin-left: 8px;">${product.originalPrice.toLocaleString("tr-TR")} TL</span>` : ""}
                </p>
              ` : ""}
              ${showButton ? `
                <a href="${productUrl}" style="display: block; background-color: ${buttonColor}; color: #ffffff; padding: 10px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 600; text-align: center;">
                  ${buttonText}
                </a>
              ` : ""}
            </div>
          </div>
        </td>
      `;
    })
    .join("");

  const rows: string[] = [];
  const cellArray = productCells.split("</td>").filter((c: string) => c.trim() !== "");

  for (let i = 0; i < cellArray.length; i += columns) {
    const rowCells = cellArray.slice(i, i + columns).map((cell: string) => cell + "</td>").join("");
    rows.push(`<tr>${rowCells}</tr>`);
  }

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: 16px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          ${rows.join("")}
        </table>
      </td>
    </tr>
  `;
}

function renderImageBlock(block: Block, options: RenderOptions): string {
  const bgColor = block.style.backgroundColor || "#ffffff";
  const imageUrl = block.content.imageUrl || "";
  const altText = block.content.altText || "";
  let linkUrl = block.content.linkUrl || "";
  const maxWidth = block.style.maxWidth || 100;
  const alignment = block.style.alignment || "center";
  const paddingY = block.style.paddingY || 16;

  if (!imageUrl) return "";

  if (options.campaignId && linkUrl) {
    linkUrl = `${options.baseUrl}/api/track/click?campaignId=${options.campaignId}&url=${encodeURIComponent(linkUrl)}`;
  }

  const alignMap: Record<string, string> = {
    left: "left",
    center: "center",
    right: "right",
  };

  const alignStyle = alignMap[alignment] || "center";

  const imageHtml = `<img src="${imageUrl}" alt="${altText}" style="max-width: ${maxWidth}%; width: auto; height: auto; display: block; margin: 0 auto;" />`;

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: ${paddingY}px 16px; text-align: ${alignStyle};">
        ${linkUrl ? `<a href="${linkUrl}">${imageHtml}</a>` : imageHtml}
      </td>
    </tr>
  `;
}

function renderDividerBlock(block: Block): string {
  const bgColor = block.style.backgroundColor || "transparent";
  const lineColor = block.style.lineColor || "#e5e7eb";
  const lineWidth = block.style.lineWidth || 1;
  const lineStyle = block.style.lineStyle || "solid";
  const paddingY = block.style.paddingY || 24;
  const widthPercent = block.style.widthPercent || 100;

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: ${paddingY}px 16px; text-align: center;">
        <hr style="width: ${widthPercent}%; border: none; border-top: ${lineWidth}px ${lineStyle} ${lineColor}; margin: 0 auto;" />
      </td>
    </tr>
  `;
}

function renderFooterBlock(block: Block, options: RenderOptions): string {
  const bgColor = block.style.backgroundColor || "#f9fafb";
  const textColor = block.style.textColor || "#6b7280";
  const companyName = block.content.companyName || "";
  const companyAddress = block.content.companyAddress || "";
  const siteLink = block.content.siteLink || "";
  const unsubscribeText = block.content.unsubscribeText || "Abonelikten çık";

  const unsubscribeLink = options.trackingId
    ? `${options.baseUrl}/unsubscribe?id=${options.trackingId}`
    : "#";

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: 32px; text-align: center;">
        ${companyName ? `<p style="margin: 0 0 8px; font-size: 14px; font-weight: bold; color: ${textColor};">${companyName}</p>` : ""}
        ${companyAddress ? `<p style="margin: 0 0 16px; font-size: 12px; color: ${textColor};">${companyAddress}</p>` : ""}
        ${siteLink ? `<p style="margin: 0 0 16px;"><a href="${siteLink}" style="color: ${textColor}; font-size: 12px; text-decoration: underline;">Web sitemizi ziyaret edin</a></p>` : ""}
        <p style="margin: 0;">
          <a href="${unsubscribeLink}" style="color: ${textColor}; font-size: 11px; text-decoration: underline;">${unsubscribeText}</a>
        </p>
      </td>
    </tr>
  `;
}

export function replaceVariables(
  html: string,
  variables: Record<string, string>
): string {
  let result = html;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  }

  return result;
}
