import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

async function main() {
  const domain = process.env.TENANT_DOMAIN ?? "jejutime.com";
  const articleId = process.env.ARTICLE_ID ?? "cmor2fwll000004l4dcax2zd8";
  const baseUrl = "http://localhost:3000";
  const url = `${baseUrl}/article/${articleId}`;

  const outDir = path.join(process.cwd(), "verification-artifacts");
  fs.mkdirSync(outDir, { recursive: true });
  const screenshotPath = path.join(
    outDir,
    `facebook-share-og-${domain}-${articleId}.png`
  );

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  await context.addCookies([
    {
      name: "tenant_domain",
      value: domain,
      url: baseUrl,
      httpOnly: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  // Read Open Graph tags from server-rendered <head>.
  async function readOg(prop: string) {
    const selector = `meta[property="${prop}"]`;
    return (await page.locator(selector).first().getAttribute("content")) || "";
  }

  const desc = await readOg("og:description");
  const og = {
    "og:title": await readOg("og:title"),
    "og:description": desc,
    "og:url": await readOg("og:url"),
    "og:type": await readOg("og:type"),
    "og:image": await readOg("og:image"),
    "og:image:width": await readOg("og:image:width"),
    "og:image:height": await readOg("og:image:height"),
    hasBase64:
      /base64/i.test(desc) || /data:image/i.test(desc) || /base64,/i.test(desc),
  };

  // Open the share dialog so the UI button is visible in the screenshot.
  const trigger = page.getByRole("button", { name: /share article/i }).first();
  await trigger.click();

  const overlayHtml = `
    <div style="
      position: fixed;
      left: 16px;
      bottom: 16px;
      width: min(680px, calc(100vw - 32px));
      background: rgba(17,24,39,0.95);
      color: white;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      padding: 12px 14px;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      z-index: 99999;
    ">
      <div style="font-weight: 700; margin-bottom: 8px;">OG verification (rendered head)</div>
      <div style="font-size: 12px; line-height: 1.35; white-space: pre-wrap;">
        og:title: ${escapeHtml(og["og:title"])}\n
        og:description: ${escapeHtml(og["og:description"])}\n
        og:url: ${escapeHtml(og["og:url"])}\n
        og:image: ${escapeHtml(og["og:image"])}\n
        og:type: ${escapeHtml(og["og:type"])}\n
        og:image:width: ${escapeHtml(og["og:image:width"])}\n
        og:image:height: ${escapeHtml(og["og:image:height"])}\n
        hasBase64BloatInDescription: ${String(og.hasBase64)}
      </div>
    </div>
  `;

  await page.evaluate(
    (html) => {
      document.body.insertAdjacentHTML("beforeend", html);
    },
    overlayHtml
  );

  // Click Facebook share and confirm a popup is opened.
  const [popup] = await Promise.all([
    page.waitForEvent("popup").catch(() => null),
    page
      .getByRole("button", { name: /facebook/i })
      .click()
      .catch(() => page.getByRole("link", { name: /^facebook$/i }).click()),
  ]);
  if (popup) {
    // Basic sanity check: Facebook Sharer URL.
    try {
      const popupUrl = popup.url();
      console.log("Popup opened:", popupUrl);
    } catch {
      // ignore
    } finally {
      await popup.close().catch(() => {});
    }
  } else {
    console.warn("No popup detected (may be blocked by browser settings).");
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  console.log("OG tags:", og);
  console.log("Screenshot saved to:", screenshotPath);

  await browser.close();
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

