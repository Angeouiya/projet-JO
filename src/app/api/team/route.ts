import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DEFAULT_TEAM_MEMBERS } from '@/data/team';
import { getRequestUser } from '@/lib/auth-http';
import { serverError, validationError } from '@/lib/api-utils';
import {
  deleteTeamMember,
  hasExternalTeamStore,
  listTeamMembers,
  normalizeTeamMember,
  saveTeamMember,
} from '@/lib/team-store';
import type { AppUser, TeamMemberData } from '@/types';

const teamQuerySchema = z.object({
  admin: z.enum(['true', 'false']).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(80).default(12),
});

const teamMemberSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(80),
  department: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(60).optional(),
  photoUrl: z.string().trim().min(1).max(500),
  bio: z.string().trim().min(4).max(700),
  publicVisible: z.boolean(),
  active: z.boolean(),
  createdAt: z.string().trim().optional(),
  updatedAt: z.string().trim().optional(),
});

function isAdminUser(user: AppUser | null) {
  return user?.type === 'admin' || user?.type === 'employee';
}

function forbiddenAdminResponse() {
  return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 });
}

function readonlyTeamResponse() {
  return NextResponse.json({
    error: 'Équipe non disponible en écriture',
    code: 'TEAM_STORE_NOT_CONFIGURED',
    message: 'Configurez le store externe Buildify pour rendre l’équipe admin durable en production.',
  }, { status: 503 });
}

function fallbackTeamMembers(includeAdminData: boolean, search?: string) {
  const normalizedSearch = search?.toLowerCase();
  return DEFAULT_TEAM_MEMBERS
    .filter(member => includeAdminData || (member.active && member.publicVisible))
    .filter(member => !normalizedSearch || [
      member.name,
      member.email,
      member.role,
      member.department,
      member.bio,
    ].some(value => value.toLowerCase().includes(normalizedSearch)));
}

export async function GET(request: Request) {
  const parsed = teamQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);

  const adminView = parsed.data.admin === 'true';
  if (adminView && !isAdminUser(await getRequestUser())) return forbiddenAdminResponse();

  try {
    if (hasExternalTeamStore()) {
      const { members, total } = await listTeamMembers({
        includeInactive: adminView,
        includePrivate: adminView,
        search: parsed.data.search,
        page: parsed.data.page,
        limit: parsed.data.limit,
      });
      return NextResponse.json({ members, total, page: parsed.data.page, limit: parsed.data.limit, store: 'external' });
    }

    const members = fallbackTeamMembers(adminView, parsed.data.search);
    return NextResponse.json({
      members: members.slice((parsed.data.page - 1) * parsed.data.limit, parsed.data.page * parsed.data.limit),
      total: members.length,
      page: parsed.data.page,
      limit: parsed.data.limit,
      store: 'default',
    });
  } catch (error) {
    console.error('TEAM_GET_ERROR', error);
    return serverError('Impossible de charger l’équipe Buildify.');
  }
}

export async function POST(request: Request) {
  if (!isAdminUser(await getRequestUser())) return forbiddenAdminResponse();
  if (!hasExternalTeamStore()) return readonlyTeamResponse();

  const body = await request.json().catch(() => null);
  const parsed = teamMemberSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const member = await saveTeamMember(parsed.data as TeamMemberData);
    return NextResponse.json({ member, store: 'external' }, { status: 201 });
  } catch (error) {
    console.error('TEAM_POST_ERROR', error);
    return serverError('Impossible d’enregistrer le membre.');
  }
}

export async function PATCH(request: Request) {
  if (!isAdminUser(await getRequestUser())) return forbiddenAdminResponse();
  if (!hasExternalTeamStore()) return readonlyTeamResponse();

  const body = await request.json().catch(() => null);
  const parsed = teamMemberSchema.extend({ id: z.string().trim().min(1) }).safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const member = await saveTeamMember(normalizeTeamMember(parsed.data));
    return NextResponse.json({ member, store: 'external' });
  } catch (error) {
    console.error('TEAM_PATCH_ERROR', error);
    return serverError('Impossible de mettre à jour le membre.');
  }
}

export async function DELETE(request: Request) {
  if (!isAdminUser(await getRequestUser())) return forbiddenAdminResponse();
  if (!hasExternalTeamStore()) return readonlyTeamResponse();

  const memberId = new URL(request.url).searchParams.get('id')?.trim();
  if (!memberId) return NextResponse.json({ error: 'Identifiant membre requis' }, { status: 400 });

  try {
    await deleteTeamMember(memberId);
    return NextResponse.json({ ok: true, store: 'external' });
  } catch (error) {
    console.error('TEAM_DELETE_ERROR', error);
    return serverError('Impossible de retirer le membre.');
  }
}
