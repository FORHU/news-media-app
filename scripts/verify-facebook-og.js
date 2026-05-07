const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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
  const og = await page.evaluate(() => {
    const read = (prop) => {
      const selector = 'meta[property="' + prop + '"]';
      const el = document.querySelector(selector);
      return (el && el.getAttribute("content")) || "";
    };

    const desc = read("og:description");
    return {
      "og:title": read("og:title"),
      "og:description": desc,
      "og:url": read("og:url"),
      "og:type": read("og:type"),
      "og:image": read("og:image"),
      "og:image:width": read("og:image:width"),
      "og:image:height": read("og:image:height"),
      hasBase64:
        /base64/i.test(desc) || /data:image/i.test(desc) || /base64,/i.test(desc),
    };
  });

  console.log("OG tags:", og);

  const debugButtons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons
      .map((b) => (b.textContent || "").trim().replace(/\s+/g, " "))
      .filter((t) => t && /share/i.test(t))
      .slice(0, 20);
  });
  console.log("Debug buttons containing 'share':", debugButtons);

  // Open the share dialog so the UI button is visible in the screenshot.
  // (Button text can vary slightly by theme; try a couple selectors.)
  await page.waitForTimeout(1500);
  let trigger = page.getByRole("button", { name: /share article/i }).first();
  if ((await trigger.count()) === 0) {
    trigger = page.getByRole("button", { name: /share/i }).first();
  }
  await trigger.waitFor({ state: "attached", timeout: 60000 });
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

  await page.evaluate((html) => {
    document.body.insertAdjacentHTML("beforeend", html);
  }, overlayHtml);

  // Click Facebook share and confirm a popup is opened.
  const [popup] = await Promise.all([
    page.waitForEvent("popup").catch(() => null),
    page
      .getByRole("button", { name: /facebook/i })
      .click()
      .catch(() => page.getByRole("link", { name: /^facebook$/i }).click()),
  ]);

  if (popup) {
    try {
      console.log("Popup opened:", popup.url());
    } catch {}
    await popup.close().catch(() => {});
  } else {
    console.warn("No popup detected (may be blocked by browser settings).");
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  console.log("OG tags:", og);
  console.log("Screenshot saved to:", screenshotPath);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

