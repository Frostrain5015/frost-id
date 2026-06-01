import nodemailer from 'nodemailer';
import {
	SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
} from '$env/static/private';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
	if (!transporter) {
		transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port: Number(SMTP_PORT),
			secure: Number(SMTP_PORT) === 465,
			auth: { user: SMTP_USER, pass: SMTP_PASS }
		});
	}
	return transporter;
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
	const t = getTransporter();
	await t.sendMail({
		from: SMTP_FROM,
		to,
		subject: 'Frost ID — Email Verification',
		text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
		html: `<div style="background:#0b0c10;padding:40px 20px;font-family:Inter,sans-serif">
<div style="max-width:400px;margin:0 auto;background:#111316;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:32px">
<p style="font-family:'Cormorant Garamond','Noto Serif SC',serif;font-size:24px;font-weight:200;letter-spacing:0.08em;color:#e4e5ea;text-align:center;margin:0 0 24px">Frost <span style="color:#7176aa">ID</span></p>
<p style="color:#e4e5ea;font-size:14px;line-height:1.6;margin:0 0 16px;text-align:center">Your verification code</p>
<div style="background:rgba(113,118,170,0.08);border:1px solid rgba(113,118,170,0.2);border-radius:8px;padding:20px;text-align:center;margin-bottom:20px">
<span style="font-size:32px;font-weight:500;letter-spacing:8px;color:#e4e5ea">${code}</span>
</div>
<p style="color:#6b7086;font-size:12px;text-align:center;margin:0">This code expires in 10 minutes.</p>
</div></div>`
	});
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
	const t = getTransporter();
	await t.sendMail({
		from: SMTP_FROM,
		to,
		subject: 'Frost ID password reset code',
		text: `Your Frost ID password reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
		html: `<div style="background:#0b0c10;padding:40px 20px;font-family:Inter,sans-serif">
<div style="max-width:400px;margin:0 auto;background:#111316;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:32px">
<p style="font-family:Inter,'Noto Sans SC',sans-serif;font-size:24px;font-weight:300;letter-spacing:0.08em;color:#e4e5ea;text-align:center;margin:0 0 24px">Frost <span style="color:#7176aa;font-weight:600">ID</span></p>
<p style="color:#e4e5ea;font-size:14px;line-height:1.6;margin:0 0 16px;text-align:center">Password reset code</p>
<div style="background:rgba(113,118,170,0.08);border:1px solid rgba(113,118,170,0.2);border-radius:8px;padding:20px;text-align:center;margin-bottom:20px">
<span style="font-size:32px;font-weight:500;letter-spacing:8px;color:#e4e5ea">${code}</span>
</div>
<p style="color:#6b7086;font-size:12px;text-align:center;margin:0">This code expires in 10 minutes.</p>
</div></div>`
	});
}
