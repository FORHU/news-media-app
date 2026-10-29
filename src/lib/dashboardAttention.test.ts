import { test } from "node:test";
import assert from "node:assert/strict";
import { toAttentionItems } from "./dashboardAttention";

const base = { failedTargets: [], newTenantCount: 0, publishedCount: 3 };
const fail = (domain: string) => ({ tenantId: domain, domain, error: "x" });

test("toAttentionItems: healthy broadcasts are left out", () => {
  assert.deepEqual(toAttentionItems([{ id: "1", title: "Fine", ...base }]), []);
});

test("toAttentionItems: failures outrank new-site gaps, which outrank drafts", () => {
  const out = toAttentionItems([
    { id: "draft", title: "D", ...base, publishedCount: 0 },
    { id: "new", title: "N", ...base, newTenantCount: 2 },
    { id: "failed", title: "F", ...base, failedTargets: [fail("a.com")] },
  ]);
  assert.deepEqual(out.map((i) => i.id), ["failed", "new", "draft"]);
  assert.equal(out[0].failed, true);
  assert.equal(out[1].failed, false);
});

test("toAttentionItems: reasons combine and long failure lists are truncated", () => {
  const [item] = toAttentionItems([
    {
      id: "x",
      title: "X",
      failedTargets: [fail("a.com"), fail("b.com"), fail("c.com"), fail("d.com")],
      newTenantCount: 1,
      publishedCount: 0,
    },
  ]);
  assert.deepEqual(item.reasons, [
    "Failed on a.com, b.com and 2 more",
    "Not yet on 1 new site",
    "Draft, not live on any site",
  ]);
  assert.equal(item.rank, 0);
});

test("toAttentionItems: keeps input order within the same rank", () => {
  const out = toAttentionItems([
    { id: "first", title: "1", ...base, publishedCount: 0 },
    { id: "second", title: "2", ...base, publishedCount: 0 },
  ]);
  assert.deepEqual(out.map((i) => i.id), ["first", "second"]);
});
