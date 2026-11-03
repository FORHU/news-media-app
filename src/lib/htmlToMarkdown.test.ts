import test from "node:test";
import assert from "node:assert/strict";
import { acceptsMarkdown, htmlToMarkdown } from "./htmlToMarkdown";

test("acceptsMarkdown", () => {
  assert.equal(acceptsMarkdown("text/markdown"), true);
  assert.equal(acceptsMarkdown("text/markdown, text/html;q=0.5"), true);
  assert.equal(acceptsMarkdown("text/html,application/xhtml+xml,*/*;q=0.8"), false);
  assert.equal(acceptsMarkdown("text/html, text/markdown;q=0.5"), false);
  assert.equal(acceptsMarkdown(null), false);
});

test("htmlToMarkdown strips chrome and converts main", () => {
  const md = htmlToMarkdown(
    "<html><head><title>T</title></head><body><nav>menu</nav><main><h1>Hi</h1><p>a <b>b</b> <a href='/x'>l</a></p><script>x()</script></main><footer>f</footer></body></html>"
  );
  assert.match(md, /^# Hi/m);
  assert.match(md, /\*\*b\*\*/);
  assert.match(md, /\[l\]\(\/x\)/);
  assert.doesNotMatch(md, /menu|x\(\)|footer/);
});
