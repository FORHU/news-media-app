import { Resend } from "resend";
import { buildNewsletterOtpHtml } from "@/emails/newsletterOtpTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewsletterOtpEmail(to: string, code: string) {
  await resend.emails.send({
    from: "NewsIcons <onboarding@resend.dev>",
    to,
    subject: "Your NewsIcons Verification Code",
    html: buildNewsletterOtpHtml(code),
  });
}

