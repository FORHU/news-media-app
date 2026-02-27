export function buildNewsletterOtpHtml(code: string) {
  return `
    <div style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" 
              style="max-width:480px;background:#ffffff;border-radius:12px;
                     box-shadow:0 8px 24px rgba(0,0,0,0.08);padding:40px;">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <h1 style="margin:0;font-size:22px;color:#ff4500;">
                    NewsIcons
                  </h1>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:12px;">
                  <h2 style="margin:0;font-size:18px;color:#222;">
                    Email Verification
                  </h2>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
                    Use the verification code below to complete your subscription.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <div style="
                    display:inline-block;
                    background:#fff5f0;
                    color:#ff4500;
                    font-size:28px;
                    font-weight:700;
                    letter-spacing:8px;
                    padding:16px 24px;
                    border-radius:8px;
                    border:2px dashed #ff4500;">
                    ${code}
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:16px;">
                  <p style="margin:0;color:#888;font-size:13px;">
                    This code expires in 10 minutes.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #eee;padding-top:16px;">
                  <p style="margin:0;color:#999;font-size:12px;text-align:center;">
                    If you didn’t request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

