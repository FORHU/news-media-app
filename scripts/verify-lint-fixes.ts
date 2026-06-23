/**
 * Regression check for the ESLint cleanup, runnable from the terminal:
 *
 *   npx tsx scripts/verify-lint-fixes.ts
 *
 * No browser is launched (Playwright was tried and explicitly rejected for
 * this project) — every check here is either a static source-pattern guard
 * for the exact bugs already found, or a plain HTTP request against a real
 * dev server. That means it CANNOT detect a true client-side hydration DOM
 * mismatch the way a browser would; it instead asserts the underlying cause
 * of each hydration bug found during this cleanup is gone (e.g. the SSR
 * output for a tenant's theme is now deterministic from the Host header,
 * not from a `window`-branching useState initializer). Interactive UI
 * behavior behind a real admin login is NOT covered here — see
 * LINT_CLEANUP_TESTING_CHECKLIST.md for that.
 *
 * Exit code 0 = everything passed. Exit code 1 = something failed; scroll
 * up for the first ✗ line.
 */

import "dotenv/config";
import { spawnSync, spawn, type ChildProcess } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const PORT = 3000;
const SKIP_BUILD = process.argv.includes("--skip-build");

type Result = { name: string; pass: boolean; detail?: string };
const results: Result[] = [];

function record(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function section(title: string) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

// ---------- Static source-pattern guards ----------
// These target the exact root causes of the three real bugs found while
// testing this cleanup, so a future edit can't silently reintroduce them.

function readFile(relPath: string): string | null {
  const full = path.join(ROOT, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

function checkNoWindowBranchingInitializer() {
  section("Static guards — hydration-mismatch antipattern");
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        const content = fs.readFileSync(full, "utf8");
        if (/useState\(\s*\(\)\s*=>[^)]*typeof window/.test(content)) {
          offenders.push(path.relative(ROOT, full));
        }
      }
    }
  };
  walk(path.join(ROOT, "src"));
  record(
    "No `useState(() => ... typeof window ...)` lazy initializer anywhere in src/",
    offenders.length === 0,
    offenders.length ? `found in: ${offenders.join(", ")}` : undefined
  );
}

function checkLoginPageIsServerComponent() {
  const page = readFile("src/app/admin/login/page.tsx");
  const isServerComponent = !!page && !page.startsWith('"use client"') && page.includes("headers()");
  record(
    "admin/login/page.tsx reads the domain server-side via headers(), not window",
    isServerComponent,
    page ? undefined : "file not found"
  );

  const client = readFile("src/app/admin/login/LoginClient.tsx");
  const takesDomainProp = !!client && /function LoginClient\(\{\s*domain\s*\}/.test(client);
  record(
    "LoginClient.tsx derives theme from a `domain` prop, not window.location",
    takesDomainProp,
    client ? undefined : "file not found"
  );
}

function checkSidebarEffectPattern() {
  const layout = readFile("src/app/admin/dashboard/layout.tsx");
  const usesEffect = !!layout && /useEffect\(\s*\(\)\s*=>\s*\{[^}]*matchMedia/.test(layout);
  const noLazyInit = !!layout && !/useState\(\s*\(\)\s*=>/.test(layout);
  record(
    "dashboard/layout.tsx sets sidebarOpen via useEffect (post-mount), not a lazy initializer",
    usesEffect && noLazyInit,
    layout ? undefined : "file not found"
  );
}

function checkProxyImageUnoptimized() {
  section("Static guards — proxy-image / next/image regression");
  const files = [
    "src/app/admin/dashboard/external/page.tsx",
    "src/app/admin/moderator/page.tsx",
  ];
  for (const rel of files) {
    const content = readFile(rel);
    if (!content) {
      record(`${rel} exists`, false, "file not found");
      continue;
    }
    const imageBlocks = content.split(/<Image\b/g).slice(1);
    const proxyImageBlocks = imageBlocks.filter((b) => b.slice(0, 400).includes("/api/admin/proxy-image"));
    const allUnoptimized = proxyImageBlocks.every((b) => /unoptimized/.test(b.slice(0, 400)));
    record(
      `${rel}: every <Image> using /api/admin/proxy-image has \`unoptimized\``,
      proxyImageBlocks.length > 0 && allUnoptimized,
      `${proxyImageBlocks.length} usage(s) found`
    );
  }

  const config = readFile("next.config.ts");
  const hasLocalPattern = !!config && /pathname:\s*['"]\/api\/admin\/proxy-image['"]/.test(config);
  record(
    "next.config.ts images.localPatterns still allows /api/admin/proxy-image",
    hasLocalPattern,
    config ? undefined : "file not found"
  );
}

// ---------- HTTP checks against a running dev server ----------

type HttpResult = { status: number; body: string; headers: http.IncomingHttpHeaders };

function httpRequest(
  reqPath: string,
  host: string,
  opts: { method?: string; cookie?: string; jsonBody?: unknown } = {}
): Promise<HttpResult> {
  const { method = "GET", cookie, jsonBody } = opts;
  const body = jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined;
  const headers: http.OutgoingHttpHeaders = { Host: host };
  if (cookie) headers["Cookie"] = cookie;
  if (body) {
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "localhost", port: PORT, path: reqPath, method, headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data, headers: res.headers }));
    });
    req.on("error", reject);
    req.setTimeout(10_000, () => req.destroy(new Error("timeout")));
    if (body) req.write(body);
    req.end();
  });
}

function httpGet(reqPath: string, host: string): Promise<HttpResult> {
  return httpRequest(reqPath, host);
}

// Extracts just the `name=value` pairs from a response's Set-Cookie headers,
// for reuse as a request's Cookie header in subsequent authenticated calls.
function cookieHeaderFrom(setCookieHeaders: string[] | undefined): string {
  if (!setCookieHeaders) return "";
  return setCookieHeaders.map((c) => c.split(";")[0]).join("; ");
}

// Turbopack dev mode compiles each route lazily, on its first request. A
// route that's never been hit yet can race that compile and briefly return
// a 404 even though it genuinely exists — observed repeatedly today against
// this exact dev server. Retry before trusting a 404.
async function withRetry404<T extends { status: number }>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last = await fn();
  for (let i = 1; i < attempts && last.status === 404; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    last = await fn();
  }
  return last;
}

function httpGetWithRetry(reqPath: string, host: string) {
  return withRetry404(() => httpGet(reqPath, host));
}

async function isServerUp(): Promise<boolean> {
  try {
    await httpGet("/admin/login", "localhost");
    return true;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 45_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp()) return true;
    await new Promise((r) => setTimeout(r, 750));
  }
  return false;
}

// child.kill() with shell: true only kills the shell wrapper, not the
// npm/node tree underneath it — leaving an orphaned dev server on :3000.
// Windows needs an explicit tree-kill; POSIX needs the child to have been
// spawned with detached: true so its pid is also its process group id.
function killProcessTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
  }
}

const TENANT_THEMES: { domain: string; slug: string }[] = [
  { domain: "newsicons.com", slug: "newsicons" },
  { domain: "lavaguetech.com", slug: "lavaguetech" },
  { domain: "voicejeju.com", slug: "voicejeju" },
  { domain: "jejujapan.com", slug: "jejujapan" },
  { domain: "jejuqq.com", slug: "jejuqq" },
  { domain: "jejutime.com", slug: "jejutime" },
  { domain: "skyblueprime.com", slug: "skyblueprime" },
];

// Note: "This page could not be found" is deliberately excluded — Next.js
// bundles the global not-found boundary's text into every page's RSC
// payload regardless of whether that page actually 404'd, so it's a
// reliable false positive. The status code already catches true 404s.
const ERROR_MARKERS = ["Application error", "Internal Server Error"];

async function checkTenantSSR() {
  section("HTTP — per-tenant SSR theme correctness (login page)");
  for (const { domain, slug } of TENANT_THEMES) {
    try {
      const { status, body } = await httpGetWithRetry("/admin/login", domain);
      const hasCorrectTheme = body.includes(`site-theme-${slug}-com`);
      const hasErrorMarker = ERROR_MARKERS.some((m) => body.includes(m));
      record(
        `${domain} /admin/login → 200, server-rendered with its own theme`,
        status === 200 && hasCorrectTheme && !hasErrorMarker,
        `status=${status}${hasCorrectTheme ? "" : ", theme class missing"}${hasErrorMarker ? ", error page detected" : ""}`
      );
    } catch (err) {
      record(`${domain} /admin/login reachable`, false, String(err));
    }
  }

  section("HTTP — per-tenant homepage smoke check");
  for (const { domain } of TENANT_THEMES) {
    try {
      const { status, body } = await httpGetWithRetry("/", domain);
      const hasErrorMarker = ERROR_MARKERS.some((m) => body.includes(m));
      record(`${domain} / → loads without an error page`, status < 400 && !hasErrorMarker, `status=${status}`);
    } catch (err) {
      record(`${domain} / reachable`, false, String(err));
    }
  }
}

async function checkAuthGating() {
  section("HTTP — admin auth gating (proxy.ts) still wired up");

  const dash = await httpGetWithRetry("/admin/dashboard", "skyblueprime.com");
  record(
    "Unauthenticated /admin/dashboard redirects to /admin/login (not a 404)",
    dash.status === 307 && (dash.headers.location ?? "").includes("/admin/login"),
    `status=${dash.status}, location=${dash.headers.location ?? "none"}`
  );

  const session = await httpGetWithRetry("/api/admin/auth/session", "skyblueprime.com");
  record(
    "Unauthenticated GET /api/admin/auth/session → 401 (route registered, not 404)",
    session.status === 401,
    `status=${session.status}`
  );

  const proxyImage = await httpGetWithRetry(
    "/api/admin/proxy-image?url=" + encodeURIComponent("https://example.com/x.jpg"),
    "skyblueprime.com"
  );
  record(
    "Unauthenticated GET /api/admin/proxy-image → 401 (route registered, not 404)",
    proxyImage.status === 401,
    `status=${proxyImage.status}`
  );
}

// ---------- Public pages: article detail, search, category navigation ----------
//
// All read-only HTTP against real DB content — no auth, no writes, safe
// against either database. Pulls a real article + category per tenant
// straight from the DB (no public "list" API needed) and confirms the
// corresponding page actually renders that content, not just "didn't 404".
async function checkPublicContent() {
  section("HTTP — public pages (article detail, search, category nav)");

  const { prisma } = await import("../src/lib/db");

  for (const { domain } of TENANT_THEMES) {
    const tenant = await prisma.tenant.findUnique({ where: { domain } });
    if (!tenant) continue;

    const article = await prisma.contentArticle.findFirst({
      where: { tenantId: tenant.id, status: "published" },
      orderBy: { publishDate: "desc" },
    });
    const category = await prisma.category.findFirst({ where: { tenantId: tenant.id } });

    if (!article) {
      console.log(`(${domain}: no published articles in this database — skipping public content checks.)`);
      continue;
    }

    // The page 307-redirects from the raw ID to the canonical slug URL when
    // one exists — use the slug directly so this test isn't asserting on a
    // redirect response.
    const articleRes = await httpGetWithRetry(`/${domain}/article/${encodeURIComponent(article.slug ?? article.id)}`, domain);
    record(
      `${domain} article detail page renders the real title`,
      articleRes.status === 200 && articleRes.body.includes(escapeHtml(article.title)),
      `status=${articleRes.status}`
    );

    const titleWord = (article.title.match(/[\p{L}\p{N}]+/gu) ?? []).find((w) => w.length >= 5);
    if (titleWord) {
      const searchRes = await httpGetWithRetry(`/${domain}/search?search=${encodeURIComponent(titleWord)}`, domain);
      record(
        `${domain} search for a real title keyword returns it`,
        searchRes.status === 200 && searchRes.body.includes(escapeHtml(article.title)),
        `status=${searchRes.status}, keyword="${titleWord}"`
      );
    }

    if (category) {
      const categoryRes = await httpGetWithRetry(
        `/${domain}/search?category=${encodeURIComponent(category.categoryName)}`,
        domain
      );
      record(
        `${domain} category navigation (${category.categoryName}) returns 200`,
        categoryRes.status === 200,
        `status=${categoryRes.status}`
      );
    }
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ---------- Authenticated checks (only run for tenants with credentials) ----------

// Maps each tenant domain to the env var holding its admin email. Password
// is shared across all tenants via ACCOUNT_PASS. Read from process.env only
// — never logged, never printed, never hardcoded here.
const TENANT_EMAIL_ENV_VARS: Record<string, string> = {
  "newsicons.com": "NEWSICONS_EMAIL",
  "lavaguetech.com": "LAVAGUETECH_EMAIL",
  "voicejeju.com": "VOICEJEJU_EMAIL",
  "jejujapan.com": "JEJUJAPAN_EMAIL",
  "jejuqq.com": "JEJUQQ_EMAIL",
  "jejutime.com": "JEJUTIME_EMAIL",
  "skyblueprime.com": "SKYBLUEPRIME_EMAIL",
};

function tenantsWithCredentials(): { domain: string; email: string }[] {
  const password = process.env.ACCOUNT_PASS;
  if (!password) return [];
  return Object.entries(TENANT_EMAIL_ENV_VARS)
    .map(([domain, envVar]) => ({ domain, email: process.env[envVar] }))
    .filter((t): t is { domain: string; email: string } => !!t.email);
}

async function loginAsTenant(domain: string, email: string): Promise<{ cookie: string; role: string } | null> {
  const password = process.env.ACCOUNT_PASS!;

  // Mirrors the real login form's flow: verify-email first, then login.
  await httpRequest("/api/admin/auth/verify-email", domain, { method: "POST", jsonBody: { email } });

  const loginRes = await httpRequest("/api/admin/auth/login", domain, {
    method: "POST",
    jsonBody: { email, password },
  });
  if (loginRes.status !== 200) return null;

  const cookie = cookieHeaderFrom(loginRes.headers["set-cookie"]);
  if (!cookie) return null;

  let role = "admin";
  try {
    role = (JSON.parse(loginRes.body).role as string) ?? "admin";
  } catch {
    // fall through with the default
  }
  return { cookie, role };
}

async function checkAuthenticatedPages() {
  section("HTTP — authenticated admin pages (real login, credentials from .env)");

  const tenants = tenantsWithCredentials();
  if (tenants.length === 0) {
    console.log(
      "No tenant credentials found (need ACCOUNT_PASS + at least one *_EMAIL var in .env) — skipping authenticated checks."
    );
    return;
  }

  let imageCheckDone = false;

  for (const { domain, email } of tenants) {
    const session = await loginAsTenant(domain, email);
    record(`${domain}: login succeeds with .env credentials`, !!session, session ? `role=${session.role}` : "login failed");
    if (!session) continue;

    const pagesToCheck =
      session.role === "moderator"
        ? ["/admin/moderator", "/admin/moderator/articles"]
        : [
            "/admin/dashboard",
            "/admin/dashboard/accounts",
            "/admin/dashboard/api-keys",
            "/admin/dashboard/banners",
            "/admin/dashboard/crawled",
            "/admin/dashboard/external",
            "/admin/dashboard/generated",
            "/admin/dashboard/urls",
            "/admin/dashboard/youtube",
            "/admin/dashboard/x/content",
            "/admin/dashboard/x/urls",
          ];

    for (const pagePath of pagesToCheck) {
      const authedRes = await withRetry404(() => httpRequest(pagePath, domain, { cookie: session.cookie }));
      record(
        `${domain} ${pagePath} → 200 when authenticated (not redirected to login)`,
        authedRes.status === 200,
        `status=${authedRes.status}`
      );
    }

    // Strongest end-to-end check for today's real bug: fetch a real external
    // article's imageUrl, then confirm the proxy-image route actually
    // returns image bytes for an authenticated request (not the 401 an
    // unauthenticated request correctly gets).
    if (!imageCheckDone) {
      const articlesRes = await httpRequest("/api/admin/external/articles?status=all&page=1&limit=20", domain, {
        cookie: session.cookie,
      });
      let imageUrl: string | undefined;
      try {
        const parsed = JSON.parse(articlesRes.body);
        const articles = parsed.articles ?? parsed.data ?? [];
        imageUrl = articles.find((a: { imageUrl?: string }) => a.imageUrl)?.imageUrl;
      } catch {
        // no articles available to test against — not a failure of this check
      }

      if (imageUrl) {
        const imageRes = await httpRequest(
          `/api/admin/proxy-image?url=${encodeURIComponent(imageUrl)}`,
          domain,
          { cookie: session.cookie }
        );
        record(
          "Authenticated /api/admin/proxy-image returns real image bytes (the cookie-forwarding fix)",
          imageRes.status === 200 && (imageRes.headers["content-type"] ?? "").startsWith("image/"),
          `status=${imageRes.status}, content-type=${imageRes.headers["content-type"] ?? "none"}`
        );
        imageCheckDone = true;
      }
    }
  }

  if (!imageCheckDone) {
    console.log("(No external article with an imageUrl found across logged-in tenants — proxy-image byte check skipped.)");
  }
}

// ---------- Admin CRUD (safe, self-cleaning — local DB only) ----------
//
// Only ever run these against a local/disposable database: each test
// creates a clearly-tagged record, exercises read/update, then deletes it
// and re-checks it's gone. No AI calls, no crawling, no scraping, no real
// emails sent — those stay manual/out of scope (see LINT_CLEANUP_TESTING_CHECKLIST.md).
const TEST_TAG = `AUTOMATED-TEST-${Date.now()}`;

async function checkAccountsCrud(domain: string, cookie: string) {
  const email = `automated-test-${Date.now()}@example.invalid`;
  let createdId: string | undefined;

  try {
    const createRes = await httpRequest("/api/admin/accounts", domain, {
      method: "POST",
      cookie,
      jsonBody: { firstName: TEST_TAG, lastName: "DO-NOT-USE", email, password: "TestPass1234!" },
    });
    const created = JSON.parse(createRes.body || "{}");
    createdId = created.id;
    record(
      `${domain} accounts: POST creates a new account`,
      createRes.status === 201 && !!createdId,
      `status=${createRes.status}`
    );
    if (!createdId) return;

    const listRes = await httpRequest("/api/admin/accounts", domain, { cookie });
    const list = JSON.parse(listRes.body || "[]");
    record(
      `${domain} accounts: GET list includes the new account`,
      Array.isArray(list) && list.some((u: { email?: string }) => u.email === email)
    );

    const patchRes = await httpRequest("/api/admin/accounts", domain, {
      method: "PATCH",
      cookie,
      jsonBody: { id: createdId, firstName: `${TEST_TAG}-UPDATED` },
    });
    const patched = JSON.parse(patchRes.body || "{}");
    record(
      `${domain} accounts: PATCH updates the account`,
      patchRes.status === 200 && patched.firstName === `${TEST_TAG}-UPDATED`,
      `status=${patchRes.status}`
    );
  } finally {
    if (createdId) {
      const deleteRes = await httpRequest("/api/admin/accounts", domain, {
        method: "DELETE",
        cookie,
        jsonBody: { id: createdId },
      });
      record(`${domain} accounts: DELETE removes the test account`, deleteRes.status === 200, `status=${deleteRes.status}`);

      const listAfter = await httpRequest("/api/admin/accounts", domain, { cookie });
      const listAfterParsed = JSON.parse(listAfter.body || "[]");
      record(
        `${domain} accounts: account is actually gone after delete`,
        Array.isArray(listAfterParsed) && !listAfterParsed.some((u: { id?: string }) => u.id === createdId)
      );
    }
  }
}

async function checkBannersCrud(domain: string, cookie: string) {
  let createdId: string | undefined;

  try {
    const createRes = await httpRequest("/api/admin/banners", domain, {
      method: "POST",
      cookie,
      jsonBody: {
        name: TEST_TAG,
        banner_type: "IMAGE",
        imageUrl: "https://example.invalid/test-banner.jpg",
        linkUrl: "https://example.invalid",
        positions: ["HOME_TOP"],
        isActive: false,
      },
    });
    const created = JSON.parse(createRes.body || "{}");
    createdId = created.id;
    record(
      `${domain} banners: POST creates a new banner`,
      createRes.status === 201 && !!createdId,
      `status=${createRes.status}`
    );
    if (!createdId) return;

    const listRes = await httpRequest("/api/admin/banners", domain, { cookie });
    const list = JSON.parse(listRes.body || "[]");
    const listFlat = Array.isArray(list) ? list : Object.values(list).flat();
    record(
      `${domain} banners: GET list includes the new banner`,
      listFlat.some((b: { name?: string }) => b?.name === TEST_TAG)
    );

    const patchRes = await httpRequest(`/api/admin/banners/${createdId}`, domain, {
      method: "PATCH",
      cookie,
      jsonBody: { name: `${TEST_TAG}-UPDATED` },
    });
    const patched = JSON.parse(patchRes.body || "{}");
    record(
      `${domain} banners: PATCH updates the banner`,
      patchRes.status === 200 && patched.name === `${TEST_TAG}-UPDATED`,
      `status=${patchRes.status}`
    );
  } finally {
    if (createdId) {
      const deleteRes = await httpRequest(`/api/admin/banners/${createdId}`, domain, {
        method: "DELETE",
        cookie,
      });
      record(`${domain} banners: DELETE removes the test banner`, deleteRes.status === 204, `status=${deleteRes.status}`);

      const listAfter = await httpRequest("/api/admin/banners", domain, { cookie });
      const listAfterParsed = JSON.parse(listAfter.body || "[]");
      const listAfterFlat = Array.isArray(listAfterParsed) ? listAfterParsed : Object.values(listAfterParsed).flat();
      record(
        `${domain} banners: banner is actually gone after delete`,
        !listAfterFlat.some((b: { id?: string }) => b?.id === createdId)
      );
    }
  }
}

// There's no DELETE endpoint for API keys (by design — revoking is done via
// the isActive/autoPublish flags, not deletion), so cleanup here goes
// straight to Prisma instead of the API. Only reachable after checkAdminCrud's
// local-DB guard has already passed.
async function checkApiKeysCrud(domain: string, cookie: string) {
  let createdId: string | undefined;
  try {
    const createRes = await httpRequest("/api/admin/apiKeys", domain, {
      method: "POST",
      cookie,
      jsonBody: { sourceName: TEST_TAG },
    });
    const created = JSON.parse(createRes.body || "{}");
    createdId = created.id;
    record(
      `${domain} apiKeys: POST creates a new API key`,
      createRes.status === 201 && !!createdId && !!created.rawKey,
      `status=${createRes.status}`
    );
    if (!createdId) return;

    const listRes = await httpRequest("/api/admin/apiKeys", domain, { cookie });
    const list = JSON.parse(listRes.body || "[]");
    record(
      `${domain} apiKeys: GET list includes the new key`,
      Array.isArray(list) && list.some((k: { id?: string }) => k.id === createdId)
    );

    const patchRes = await httpRequest("/api/admin/apiKeys", domain, {
      method: "PATCH",
      cookie,
      jsonBody: { id: createdId, autoPublish: true },
    });
    const patched = JSON.parse(patchRes.body || "{}");
    record(
      `${domain} apiKeys: PATCH updates autoPublish`,
      patchRes.status === 200 && patched.autoPublish === true,
      `status=${patchRes.status}`
    );
  } finally {
    if (createdId) {
      const { prisma } = await import("../src/lib/db");
      await prisma.apiKey.delete({ where: { id: createdId } }).catch(() => {});
      record(`${domain} apiKeys: test key cleaned up directly (no DELETE endpoint exists)`, true);
    }
  }
}

// Generated/crawled-article workflows are normally created via AI generation
// or real crawling — both excluded from automated testing (real cost, real
// external side effects). So instead of going through those flows, these
// tests insert a tagged fixture row directly via Prisma, exercise the safe
// (non-AI) API actions against it, then delete the fixture. Only reachable
// after checkAdminCrud's local-DB guard has already passed.
async function checkGeneratedArticlesCrud(domain: string, cookie: string) {
  const { prisma } = await import("../src/lib/db");

  const tenant = await prisma.tenant.findUnique({ where: { domain } });
  const category = tenant ? await prisma.category.findFirst({ where: { tenantId: tenant.id } }) : null;
  const user = tenant ? await prisma.user.findFirst({ where: { tenantId: tenant.id } }) : null;
  if (!tenant || !category || !user) {
    console.log(`(${domain}: no category/user fixture available — skipping generated-articles CRUD.)`);
    return;
  }

  const fixture = await prisma.contentArticle.create({
    data: {
      tenantId: tenant.id,
      usersId: user.id,
      categoryId: category.id,
      title: TEST_TAG,
      content: "Automated test content — safe to delete.",
      status: "draft",
      // The list sorts by publishDate DESC NULLS LAST — a null here would
      // sink the fixture to the bottom of tenants with lots of real
      // articles and drop it past the query's limit. Setting "now" keeps
      // it at the top regardless of how much real content exists.
      publishDate: new Date(),
    },
  });

  try {
    const listRes = await httpRequest("/api/admin/generatedArticles?status=all&limit=50", domain, { cookie });
    const list = JSON.parse(listRes.body || "{}");
    record(
      `${domain} generatedArticles: GET list includes the fixture article`,
      Array.isArray(list.articles) && list.articles.some((a: { id?: string }) => a.id === fixture.id)
    );

    const patchRes = await httpRequest(`/api/admin/generatedArticles/${fixture.id}`, domain, {
      method: "PATCH",
      cookie,
      jsonBody: { title: `${TEST_TAG}-UPDATED` },
    });
    const patched = JSON.parse(patchRes.body || "{}");
    record(
      `${domain} generatedArticles: PATCH updates the article`,
      patchRes.status === 200 && patched.title === `${TEST_TAG}-UPDATED`,
      `status=${patchRes.status}`
    );

    const deleteRes = await httpRequest(`/api/admin/generatedArticles/${fixture.id}`, domain, {
      method: "DELETE",
      cookie,
    });
    record(`${domain} generatedArticles: DELETE removes the article`, deleteRes.status === 200, `status=${deleteRes.status}`);

    const stillExists = await prisma.contentArticle.findUnique({ where: { id: fixture.id } });
    record(`${domain} generatedArticles: article is actually gone after delete`, !stillExists);
  } finally {
    await prisma.contentArticle.delete({ where: { id: fixture.id } }).catch(() => {});
  }
}

async function checkCrawledArticlesCrud(domain: string, cookie: string) {
  const { prisma } = await import("../src/lib/db");

  const tenant = await prisma.tenant.findUnique({ where: { domain } });
  const category = tenant ? await prisma.category.findFirst({ where: { tenantId: tenant.id } }) : null;
  if (!tenant || !category) {
    console.log(`(${domain}: no category fixture available — skipping crawled-articles CRUD.)`);
    return;
  }

  const crawledUrl = await prisma.crawledUrl.create({
    data: { tenantId: tenant.id, url: `https://example.invalid/${TEST_TAG}`, status: "crawled" },
  });
  const fixture = await prisma.rawArticle.create({
    data: {
      tenantId: tenant.id,
      crawledUrlId: crawledUrl.id,
      categoryId: category.id,
      title: TEST_TAG,
      content: "Automated test content — safe to delete.",
      status: "pending",
    },
  });

  try {
    const listRes = await httpRequest("/api/admin/crawledArticles?status=all&limit=50", domain, { cookie });
    const list = JSON.parse(listRes.body || "{}");
    record(
      `${domain} crawledArticles: GET list includes the fixture article`,
      Array.isArray(list.articles) && list.articles.some((a: { id?: string }) => a.id === fixture.id)
    );

    const deleteRes = await httpRequest(`/api/admin/crawledArticles/${fixture.id}`, domain, {
      method: "DELETE",
      cookie,
    });
    record(`${domain} crawledArticles: DELETE removes the article`, deleteRes.status === 200, `status=${deleteRes.status}`);

    const stillExists = await prisma.rawArticle.findUnique({ where: { id: fixture.id } });
    record(`${domain} crawledArticles: article is actually gone after delete`, !stillExists);
  } finally {
    await prisma.rawArticle.delete({ where: { id: fixture.id } }).catch(() => {});
    await prisma.crawledUrl.delete({ where: { id: crawledUrl.id } }).catch(() => {});
  }
}

// No safe write path exists for X-monitoring content via the API (creation
// only happens through real scraping; there's no DELETE endpoint at all) —
// this is a read-only sanity check, not a CRUD cycle.
async function checkXMonitoringRead(domain: string, cookie: string) {
  const res = await httpRequest("/api/admin/xMonitoring", domain, { cookie });
  let parsed: { tweets?: unknown[] } = {};
  try {
    parsed = JSON.parse(res.body || "{}");
  } catch {
    // leave parsed empty — record() below will fail on the malformed response
  }
  record(
    `${domain} xMonitoring: GET returns the tweets list (read-only — no safe write path exists)`,
    res.status === 200 && Array.isArray(parsed.tweets),
    `status=${res.status}`
  );
}

async function checkAdminCrud() {
  section("HTTP — admin CRUD (safe, self-cleaning, local DB only)");

  if (process.env.DATABASE_URL !== "postgresql://postgres:password@localhost:5432/news-media") {
    console.log(
      "DATABASE_URL is not the local Docker database — refusing to run CRUD checks " +
        "(they create/delete real records and must never run against a real database)."
    );
    return;
  }

  const tenants = tenantsWithCredentials();
  if (tenants.length === 0) {
    console.log("No tenant credentials found — skipping admin CRUD checks.");
    return;
  }

  for (const { domain, email } of tenants) {
    const session = await loginAsTenant(domain, email);
    if (!session) continue;
    await checkAccountsCrud(domain, session.cookie);
    await checkBannersCrud(domain, session.cookie);
    if (session.role === "admin") {
      await checkApiKeysCrud(domain, session.cookie);
      await checkGeneratedArticlesCrud(domain, session.cookie);
      await checkCrawledArticlesCrud(domain, session.cookie);
      await checkXMonitoringRead(domain, session.cookie);
    }
  }
}

// ---------- Orchestration ----------

function runCommand(name: string, cmd: string, args: string[]): boolean {
  console.log(`\n› ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: true });
  const pass = res.status === 0;
  record(name, pass);
  return pass;
}

async function main() {
  section("Static checks");
  runCommand("eslint (npm run lint, --max-warnings=0)", "npm", ["run", "lint"]);
  runCommand("tsc --noEmit", "npx", ["tsc", "--noEmit"]);
  if (!SKIP_BUILD) {
    runCommand("next build", "npm", ["run", "build"]);
  } else {
    console.log("(skipping next build — ran with --skip-build)");
  }

  checkNoWindowBranchingInitializer();
  checkLoginPageIsServerComponent();
  checkSidebarEffectPattern();
  checkProxyImageUnoptimized();

  section("Dev server");
  let startedServer: ChildProcess | null = null;
  const alreadyUp = await isServerUp();
  if (alreadyUp) {
    console.log(`Reusing dev server already running on :${PORT}`);
  } else {
    console.log(`Starting dev server on :${PORT} for HTTP checks...`);
    // shell: true is required for npm to resolve on Windows here — spawning
    // npm.cmd directly without a shell throws EINVAL on some Node/Windows
    // combinations. The args are fixed literals, not external input.
    startedServer = spawn("npm", ["run", "dev"], { cwd: ROOT, shell: true, detached: true, stdio: "ignore" });
    const up = await waitForServer();
    record("Dev server became ready within 45s", up);
    if (!up) {
      killProcessTree(startedServer);
      printSummaryAndExit();
      return;
    }
  }

  try {
    await checkTenantSSR();
    await checkAuthGating();
    await checkPublicContent();
    await checkAuthenticatedPages();
    await checkAdminCrud();
  } finally {
    if (startedServer) {
      console.log("\nStopping the dev server this script started...");
      killProcessTree(startedServer);
    }
  }

  printSummaryAndExit();
}

function printSummaryAndExit() {
  const failed = results.filter((r) => !r.pass);
  section("Summary");
  console.log(`${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log("\nFailed checks:");
    for (const f of failed) console.log(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
    console.log(
      "\nNote: interactive admin UI behavior behind a real login (image rendering," +
        " crawl jobs, sidebar toggle clicks, etc.) is not covered here — see" +
        " LINT_CLEANUP_TESTING_CHECKLIST.md."
    );
    process.exit(1);
  } else {
    console.log("\nAll automated checks passed. Remaining manual items: LINT_CLEANUP_TESTING_CHECKLIST.md.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Script crashed:", err);
  process.exit(1);
});
