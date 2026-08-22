import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      error: 'Données invalides',
      details: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    },
    { status: 400 }
  );
}

export function serverError(message = 'Erreur serveur') {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function normalizeText(value?: string | null) {
  const text = value?.trim();
  return text ? text : undefined;
}

export function normalizeEmail(value?: string | null) {
  const email = normalizeText(value)?.toLowerCase();
  return email || undefined;
}
