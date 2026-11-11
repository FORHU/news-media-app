import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveRetiredArticle } from "./retiredArticles";
import { RETIRED_ARTICLES } from "../config/retiredArticles";

test("retired slug without a replacement is 410", () => {
  assert.deepEqual(
    resolveRetiredArticle("legalhyper.com", "/article/2026-09-10-forhu-inc-pioneers-ai-governance"),
    { status: 410 }
  );
});

test("numbered duplicate 301s to the surviving article on the same host", () => {
  assert.deepEqual(
    resolveRetiredArticle("linktechnews.com", "/article/2026-09-09-forhu-engineering-glassbox-era-trustworthy-8"),
    { status: 301, location: "/article/2026-09-09-forhu-engineering-glassbox-era-trustworthy" }
  );
});

test("the same slug on a different host is untouched", () => {
  assert.equal(
    resolveRetiredArticle("magazineair.com", "/article/2026-09-10-forhu-inc-shifts-ai-governance"),
    null
  );
});

test("live articles are never matched", () => {
  assert.equal(
    resolveRetiredArticle("linktechnews.com", "/article/2026-09-09-forhu-engineering-glassbox-era-trustworthy"),
    null
  );
  assert.equal(resolveRetiredArticle("legalhyper.com", "/article/2026-11-10-contradiction-coincidence"), null);
});

test("encoded and decoded unicode slugs both match the wildcard entry", () => {
  const decoded = "/article/2026-05-28-제주도의-봄-유채꽃과-벚꽃이-물든-하루";
  assert.deepEqual(resolveRetiredArticle("voicejeju.com", decoded), { status: 410 });
  assert.deepEqual(resolveRetiredArticle("voicejeju.com", encodeURI(decoded)), { status: 410 });
});

test("non-article paths and trailing slashes", () => {
  assert.equal(resolveRetiredArticle("newsicons.com", "/"), null);
  assert.deepEqual(resolveRetiredArticle("newsicons.com", "/article/cmnog05vh000004jxc1xx6nm5/"), { status: 410 });
});

test("no redirect destination is itself retired or points off-host", () => {
  for (const [domain, entries] of Object.entries(RETIRED_ARTICLES)) {
    for (const dest of Object.values(entries)) {
      if (dest === null) continue;
      assert.ok(!/[/:]/.test(dest), `${domain}: destination must be a bare slug`);
      assert.equal(resolveRetiredArticle(domain, `/article/${dest}`), null, `${domain}: ${dest} is retired`);
    }
  }
});
