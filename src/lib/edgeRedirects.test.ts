import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalHostRedirect,
  legacyCategoryRedirect,
  visitorScheme,
  isAdminPath,
} from "./edgeRedirects";

test("www host redirects to https apex keeping path and query", () => {
  assert.equal(
    canonicalHostRedirect({ host: "www.techoggi.com", proto: "https", pathname: "/article/x", search: "?a=1" }),
    "https://techoggi.com/article/x?a=1"
  );
});

test("http visitor redirects to https, apex stays apex", () => {
  assert.equal(
    canonicalHostRedirect({ host: "skyblueprime.com", proto: "http", pathname: "/", search: "" }),
    "https://skyblueprime.com/"
  );
});

test("https apex and local dev are left alone", () => {
  assert.equal(canonicalHostRedirect({ host: "newsicons.com", proto: "https", pathname: "/", search: "" }), null);
  assert.equal(canonicalHostRedirect({ host: "newsicons.com", proto: null, pathname: "/", search: "" }), null);
  assert.equal(canonicalHostRedirect({ host: "localhost:3000", proto: "http", pathname: "/", search: "" }), null);
  assert.equal(canonicalHostRedirect({ host: "www.localhost:3000", proto: "http", pathname: "/", search: "" }), null);
});

test("visitorScheme trusts only CF-Visitor, never X-Forwarded-Proto", () => {
  assert.equal(visitorScheme(new Headers({ "cf-visitor": '{"scheme":"http"}' })), "http");
  assert.equal(visitorScheme(new Headers({ "cf-visitor": '{"scheme":"https"}' })), "https");
  assert.equal(visitorScheme(new Headers({ "x-forwarded-proto": "http" })), null);
  assert.equal(visitorScheme(new Headers({ "cf-visitor": "not json" })), null);
  assert.equal(visitorScheme(new Headers()), null);
});

test("legacy homepage category params map to the search facet", () => {
  assert.equal(legacyCategoryRedirect("/", new URLSearchParams("cat=lifestyle")), "/search?category=lifestyle");
  assert.equal(legacyCategoryRedirect("/", new URLSearchParams("category=World")), "/search?category=World");
  assert.equal(legacyCategoryRedirect("/", new URLSearchParams("utm_source=x")), null);
  assert.equal(legacyCategoryRedirect("/search", new URLSearchParams("category=World")), null);
});

test("admin path detection", () => {
  assert.ok(isAdminPath("/admin"));
  assert.ok(isAdminPath("/admin/login"));
  assert.ok(!isAdminPath("/administrators"));
});
