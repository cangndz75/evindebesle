import puppeteer from "puppeteer";
import { Buffer } from "buffer";

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const uint8array = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  return Buffer.from(uint8array);
}
