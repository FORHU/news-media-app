# Edge redirects for http:// and www. (Cloudflare dashboard)

Observed on 2026-11-11 for every tenant host (checked on techoggi.com):

| Request | Observed | Wanted |
| --- | --- | --- |
| `http://<host>/` | `307` (earlier reports: `500` from Cloudflare Pingora) | `301` to `https://<host>/`, same path and query |
| `https://www.<host>/` | `307` to the apex | `301` to `https://<host>/`, same path and query |

The `307`s are **not emitted by this app**: `src/proxy.ts` never redirected `www.` or `http://`.
They come from Cloudflare (Always Use HTTPS / a redirect or page rule), so the permanent fix has to be made in
the Cloudflare dashboard for each zone. This repo has no `wrangler.toml`, Terraform or other edge config to put
it in, and no Cloudflare API integration was added.

## Dashboard steps (repeat per zone, or use a bulk redirect list)

1. **SSL/TLS > Edge Certificates > Always Use HTTPS = On.** This answers `http://` with a `301`.
   If `http://` still returns `500`, the origin/edge route for port 80 is failing before the redirect runs;
   check **Rules > Redirect Rules** is evaluated before any Workers route or origin rule for that hostname.
2. **Rules > Redirect Rules > Create rule** "www to apex":
   - When: `Hostname equals www.<host>`
   - Then: **Dynamic** redirect, expression `concat("https://<host>", http.request.uri)` (this keeps path and query),
     status code **301**.
3. If an existing Page Rule or Redirect Rule already redirects www with `302`/`307`, change its status to `301`
   rather than adding a second rule.
4. Verify:
   ```
   curl -sI "http://<host>/article/x?y=1"        # 301, location: https://<host>/article/x?y=1
   curl -sI "https://www.<host>/article/x?y=1"   # 301, location: https://<host>/article/x?y=1
   ```

## What the app does as a safety net

`src/proxy.ts` (via `src/lib/edgeRedirects.ts`) now also answers, with a `301`:

- any request whose `Host` starts with `www.` (non-local hosts) -> `https://<apex><path><query>`
- any request Cloudflare reports as plain http (`CF-Visitor: {"scheme":"http"}`) -> `https://...`

This only matters for requests that actually reach the origin. `X-Forwarded-Proto` is deliberately not used
(Next stamps `http` on direct connections and plain proxies may too, which could redirect-loop).

## robots.txt note

`/admin` is still `Disallow`ed in `src/app/robots.ts`, and `/admin/*` now sends `X-Robots-Tag: noindex, nofollow`.
Google cannot read the `noindex` header on a URL it is not allowed to fetch, so URLs that are already known
(`/admin/login?redirectTo=...`, `/admin/dashboard`) may linger until the `Disallow` is lifted. Public pages no
longer link to `/admin`. Whether to lift the `Disallow` was left for the owner to decide.
