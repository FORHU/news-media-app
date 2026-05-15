import { Resend } from "resend";
import { buildNewsletterOtpHtml } from "@/emails/newsletterOtpTemplate";

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");
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

