import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validationError } from '@/lib/api-utils';
import { createPasswordReset } from '@/lib/auth-store';

const resetSchema = z.object({
  email: z.string().trim().email(),
});

function missingEmailConfig() {
  return NextResponse.json({
    error: 'Service e-mail non configuré',
    code: 'SERVICE_NOT_CONFIGURED',
    message: "Service e-mail sécurisé non configuré. La récupération sera disponible après configuration de l'envoi par e-mail.",
    requiredConfiguration: ['RESEND_API_KEY', 'BUILDIFY_EMAIL_FROM'],
  }, { status: 503 });
}

function buildResetLink(baseUrl: string, email: string, token: string) {
  const url = new URL(baseUrl);
  url.searchParams.set('email', email);
  url.searchParams.set('token', token);
  return url.toString();
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BUILDIFY_EMAIL_FROM || process.env.RESEND_FROM_EMAIL;
  const resetBaseUrl = process.env.BUILDIFY_PASSWORD_RESET_URL || new URL('/reset-password', request.url).toString();

  if (!apiKey || !from) return missingEmailConfig();

  const email = parsed.data.email.toLowerCase();
  const reset = await createPasswordReset(email);
  if (!reset) return NextResponse.json({ ok: true });
  const resetLink = buildResetLink(resetBaseUrl, email, reset.token);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Réinitialisation de votre mot de passe Buildify',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h1 style="font-size:20px">Réinitialisation Buildify</h1>
          <p>Une demande de récupération de mot de passe a été lancée pour votre compte.</p>
          <p><a href="${resetLink}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Réinitialiser mon mot de passe</a></p>
          <p style="font-size:12px;color:#666">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        </div>
      `,
      text: `Réinitialisez votre mot de passe Buildify : ${resetLink}`,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({
      error: 'Service e-mail indisponible',
      code: 'EMAIL_DELIVERY_FAILED',
      message: "Le service e-mail est configuré mais l'envoi a échoué.",
    }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
