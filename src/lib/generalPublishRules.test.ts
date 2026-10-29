import { test } from "node:test";
import assert from "node:assert/strict";
import { detectStrayNotes, shouldReslugCopy, deriveFailedTargets } from "./generalPublishRules";

const BODY = "First paragraph.\n\nSecond paragraph that ends the article.";

test("detectStrayNotes: clean article has no findings", () => {
  const r = detectStrayNotes(BODY);
  assert.deepEqual(r.found, []);
  assert.equal(r.canClean, false);
  assert.equal(r.cleaned, BODY);
});

test("detectStrayNotes: removes the --- rule and SEO notes block", () => {
  const withNotes = `${BODY}\n\n---\nSEO Title: A title\nMeta Description: A description\nTarget Tags: ai, law`;
  const r = detectStrayNotes(withNotes);
  assert.deepEqual(r.found, ["SEO Title", "Meta Description", "Target Tags"]);
  assert.equal(r.canClean, true);
  assert.equal(r.cleaned, BODY);
});

test("detectStrayNotes: handles bold labels and notes without a rule", () => {
  const r = detectStrayNotes(`${BODY}\n\n**SEO Title:** A title\n**Meta Description:** text`);
  assert.deepEqual(r.found, ["SEO Title", "Meta Description"]);
  assert.equal(r.cleaned, BODY);
});

test("detectStrayNotes: a label mid-article is flagged but never cut", () => {
  const text = `Intro.\n\nSEO Title: oops\n\nA real paragraph that follows the label.`;
  const r = detectStrayNotes(text);
  assert.deepEqual(r.found, ["SEO Title"]);
  assert.equal(r.canClean, false);
  assert.equal(r.cleaned, text);
});

test("detectStrayNotes: notes at the very top are not auto-removed", () => {
  const text = "SEO Title: a\nMeta Description: b";
  const r = detectStrayNotes(text);
  assert.equal(r.canClean, false);
  assert.equal(r.cleaned, text);
});

test("detectStrayNotes: ordinary prose containing 'meta description' is ignored", () => {
  const r = detectStrayNotes("Writers often tweak the meta description: it helps search.");
  assert.deepEqual(r.found, []);
});

test("shouldReslugCopy: only unpublished copies with a changed title are re-slugged", () => {
  assert.equal(shouldReslugCopy("New", { title: "Old", status: "pending" }), true);
  assert.equal(shouldReslugCopy("New", { title: "Old", status: "published" }), false);
  assert.equal(shouldReslugCopy("Same", { title: "Same", status: "pending" }), false);
  assert.equal(shouldReslugCopy(undefined, { title: "Old", status: "pending" }), false);
});

test("deriveFailedTargets: drops tenants that now have a copy and de-duplicates", () => {
  const a = { tenantId: "t1", domain: "a.com", error: "boom" };
  const b = { tenantId: "t2", domain: "b.com", error: "no_system_user" };
  const result = deriveFailedTargets(
    [{ failures: [a, b] }, { failures: [{ ...a, error: "again" }] }, { failures: null }],
    new Set(["t2"])
  );
  assert.deepEqual(result, [{ ...a, error: "again" }]);
});
