import { Resend } from "resend";
import { buildNewsletterOtpHtml } from "@/emails/newsletterOtpTemplate";
import { requireEnv } from "@/lib/env";

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(requireEnv("RESEND_API_KEY"));
  }
  return resendInstance;
}

export async function sendNewsletterOtpEmail(to: string, code: string, siteName: string, domain: string) {
  const resend = getResend();
  await resend.emails.send({
    from: `${siteName} <no-reply@mail.${domain}>`,
    to,
    subject: `Your ${siteName} Verification Code`,
    html: buildNewsletterOtpHtml(code, siteName),
  });
}

