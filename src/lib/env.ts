import { z } from "zod";

/**
 * Centralized, validated access to server-side environment variables.
 *
 * Rules of the road:
 *  - Application code should import `env` / `requireEnv` from here instead of
 *    reading `process.env.*` directly, so there is one schema, one set of
 *    defaults, and one place to audit which secrets the app consumes.
 *  - Secrets are optional at parse time so `next build` (which runs without a
 *    populated environment in CI) never crashes. When a value is mandatory for
 *    a given code path, call `requireEnv("KEY")` at the point of use — it throws
 *    a clear, actionable error instead of letting an empty string flow into a
 *    downstream 401/500.
 *  - No fake fallback values ("dummy_key", "re_dummy_..."). A missing secret
 *    should fail loudly, not silently misbehave.
 *  - A var that is set but blank is treated the same as unset.
 *
 * This module must only be imported from server-side code (route handlers,
 * services, server components). Non-`NEXT_PUBLIC_` vars are not available in the
 * browser bundle.
 */

/** Optional string: unset or blank both become `undefined`; the value is trimmed. */
const optionalStr = () =>
  z
    .string()
    .optional()
    .transform((v) => {
      const t = v?.trim();
      return t ? t : undefined;
    });

/** Like `optionalStr` but also strips trailing slashes, for URL bases. */
const optionalUrl = () =>
  z
    .string()
    .optional()
    .transform((v) => {
      const t = v?.trim().replace(/\/+$/, "");
      return t ? t : undefined;
    });

const schema = z.object({
  // --- Object storage (S3 / CloudFront) ---
  // No default: the whole stack is single-region. A missing value should fail
  // loudly via requireEnv(), not silently fall back to us-east-1 and produce a
  // cryptic S3 "PermanentRedirect".
  AWS_REGION: optionalStr(),
  AWS_S3_BUCKET: optionalStr(),
  // Both the AWS-native name and the app-prefixed names used in .env / compose.
  APP_AWS_ACCESS_KEY_ID: optionalStr(),
  APP_AWS_ACCESS_KEY: optionalStr(),
  APP_AWS_SECRET_ACCESS_KEY: optionalStr(),
  CLOUDFRONT_URL: optionalUrl(),

  // --- Article generation pipeline ---
  /** External EC2 service that generates article text (`/chat`, `/session-id`). */
  GENERATE_CONTENT_API: optionalUrl(),
  OPENAI_API_KEY: optionalStr(),
  XPOZ_API_KEY: optionalStr(),
  XPOZ_SERVER_URL: optionalUrl(),
  APIFY_API_TOKEN: optionalStr(),
  SUPADATA_API_KEY: optionalStr(),
  MEDIASTACK_API_KEY: optionalStr(),
  CRAWL_API_URL: optionalUrl(),
  CRAWL_STOP_API_URL: optionalUrl(),
  /** HMAC shared secret for the inbound external-article webhook. */
  EXTERNAL_API_WEBHOOK_SECRET: optionalStr(),

  // --- Other integrations ---
  RESEND_API_KEY: optionalStr(),
  YOUTUBE_API_V3_KEY: optionalStr(),
  SUPABASE_SERVICE_ROLE_KEY: optionalStr(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

/** Parsed + validated environment. Optional keys are `undefined` when unset or blank. */
export const env = Object.freeze(parsed.data);

export type Env = typeof env;

/**
 * Returns a required environment value, throwing a clear error when it is not
 * configured. Use at the point where the value is genuinely required so that a
 * missing secret surfaces as an obvious misconfiguration.
 */
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable: ${String(key)}. ` +
        `Set it in .env for local development, or in the deployment environment.`
    );
  }
  return value as NonNullable<Env[K]>;
}

/** True when S3 object storage is configured enough to attempt uploads. */
export const isS3Configured = (): boolean => Boolean(env.AWS_S3_BUCKET);
