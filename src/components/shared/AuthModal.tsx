'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/app-store';
import { COUNTRY_CODES, countryValue, getCountry, getDialCode, isEmail, isPhone, normalizePhone } from '@/lib/country-codes';
import { BrandLogo } from './BrandLogo';

type AuthMode = 'choice' | 'login' | 'register' | 'forgot' | 'reset-sent' | 'admin-login';
type AuthPlatform = 'public' | 'client' | 'admin';

function passwordError(password: string): string | null {
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (!/[A-Za-zÀ-ÿ]/.test(password)) return 'Ajoutez au moins une lettre.';
  if (!/\d/.test(password)) return 'Ajoutez au moins un chiffre.';
  return null;
}

function isBuildifyAdminEmail(email: string): boolean {
  return /^admin@buildify\.ci$/i.test(email.trim()) || /@(buildify|groupeebc)\.[a-z]{2,}$/i.test(email.trim());
}

export function AuthModal({ platform = 'public' }: { platform?: AuthPlatform }) {
  const { showAuthModal, dismissAuth, login } = useAppStore();
  const isAdminPlatform = platform === 'admin';
  const [mode, setMode] = useState<AuthMode>(() => isAdminPlatform ? 'admin-login' : 'choice');
  const displayMode: AuthMode = isAdminPlatform ? 'admin-login' : mode === 'admin-login' ? 'choice' : mode;
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    identifier: '',
    name: '',
    email: '',
    phone: '',
    countryDialCode: countryValue(COUNTRY_CODES[0]),
    password: '',
    confirmPassword: '',
    resetEmail: '',
    adminEmail: '',
    adminPassword: '',
  });

  if (!showAuthModal) return null;

  const set = (key: keyof typeof form, value: string) => {
    setError('');
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const goMode = (nextMode: AuthMode) => {
    if (isAdminPlatform && nextMode !== 'admin-login') return;
    setError('');
    setMode(nextMode);
  };

  const handleLogin = async () => {
    const identifier = form.identifier.trim();
    const identifierIsEmail = isEmail(identifier);
    const normalizedPhone = identifierIsEmail ? '' : normalizePhone(identifier, getDialCode(form.countryDialCode));
    if (!identifier || (!identifierIsEmail && !isPhone(normalizedPhone))) {
      setError('Saisissez un e-mail valide ou un numéro de téléphone valide.');
      return;
    }
    if (!form.password) {
      setError('Le mot de passe est obligatoire.');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 650));
    login({
      id: `client-${identifier.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 32) || 'bati'}`,
      name: form.name || 'Client Buildify',
      email: identifierIsEmail ? identifier : undefined,
      phone: identifierIsEmail ? form.phone || undefined : normalizedPhone,
      type: 'client',
      role: 'client',
    });
    setLoading(false);
  };

  const handleRegister = async () => {
    const email = form.email.trim();
    const phone = form.phone.trim() ? normalizePhone(form.phone, getDialCode(form.countryDialCode)) : '';
    const passError = passwordError(form.password);

    if (!form.name.trim()) {
      setError('Le nom complet est obligatoire.');
      return;
    }
    if (!email && !phone) {
      setError('Ajoutez au moins un e-mail ou un numéro de téléphone.');
      return;
    }
    if (email && !isEmail(email)) {
      setError("L'adresse e-mail n'est pas valide.");
      return;
    }
    if (phone && !isPhone(phone)) {
      setError("Le numéro de téléphone n'est pas valide.");
      return;
    }
    if (passError) {
      setError(passError);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    login({
      id: `client-${(email || phone).toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 32) || 'bati'}`,
      name: form.name.trim(),
      email: email || undefined,
      phone: phone || undefined,
      type: 'client',
      role: 'client',
    });
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    const resetEmail = form.resetEmail.trim();
    if (!isEmail(resetEmail)) {
      setError('La récupération du mot de passe se fait par e-mail.');
      return;
    }

    setLoading(true);
    const response = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail }),
    });
    const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    setLoading(false);
    if (!response.ok) {
      setError(payload?.message || payload?.error || "Le service de récupération n'est pas disponible.");
      return;
    }
    goMode('reset-sent');
  };

  const handleAdminLogin = async () => {
    const adminEmail = form.adminEmail.trim();
    const passError = passwordError(form.adminPassword);
    if (!isEmail(adminEmail)) {
      setError("Saisissez l'e-mail administrateur.");
      return;
    }
    if (!isBuildifyAdminEmail(adminEmail)) {
      setError("Utilisez un e-mail habilité Buildify ou Groupe EBC pour accéder à cette plateforme.");
      return;
    }
    if (passError) {
      setError(passError);
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 650));
    login({
      id: 'admin-buildify-1',
      name: 'Diabaté Ibrahim',
      email: adminEmail,
      phone: '+225 01 02 03 04',
      type: 'admin',
      role: 'super_admin',
    });
    setLoading(false);
  };

  return (
    <div
        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
        onClick={dismissAuth}
      >
        <div
          className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={event => event.stopPropagation()}
        >
          <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-border">
            {displayMode !== 'choice' && !isAdminPlatform ? (
              <button type="button" onClick={() => goMode('choice')} className="p-1 hover:bg-muted rounded-lg" aria-label="Retour">
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div />
            )}
            <BrandLogo size="xs" />
            <button type="button" onClick={dismissAuth} className="p-1 hover:bg-muted rounded-lg" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {displayMode !== 'forgot' && displayMode !== 'reset-sent' && displayMode !== 'admin-login' && (
              <div className="mb-4 rounded-xl border bg-muted/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
                Indicatif Côte d'Ivoire : <span className="font-semibold text-foreground">+225</span>. Vous pouvez aussi choisir un autre pays pour vous connecter par téléphone.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl border bg-muted/50 px-4 py-3 text-xs font-medium leading-5 text-foreground">
                {error}
              </div>
            )}

            {displayMode === 'choice' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold">Bienvenue</h3>
                  <p className="text-sm text-muted-foreground mt-1">Connexion sécurisée par mot de passe.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <Mail className="w-4 h-4 text-primary" />
                    <p className="mt-2 text-xs font-semibold">E-mail recommandé</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Connexion et récupération.</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <Phone className="w-4 h-4" />
                    <p className="mt-2 text-xs font-semibold">Téléphone multi-pays</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Avec indicatif et mot de passe.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-sm font-semibold">Espace client</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Créer ou suivre vos dossiers, devis, propositions et documents.</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Button className="justify-start gap-3 h-11" onClick={() => goMode('login')}>
                        <LockKeyhole className="w-4 h-4" />
                        Connexion client
                      </Button>
                      <Button variant="outline" className="justify-start gap-3 h-11" onClick={() => goMode('register')}>
                        <BadgeCheck className="w-4 h-4" />
                        Créer un compte
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {displayMode === 'admin-login' && (
              <form
                className="space-y-4"
                onSubmit={event => {
                  event.preventDefault();
                  handleAdminLogin();
                }}
              >
                <div>
                  <h3 className="text-lg font-bold">Plateforme admin</h3>
                  <p className="text-sm text-muted-foreground mt-1">Accès séparé pour les comptes habilités Buildify.</p>
                </div>
                <div className="rounded-xl border bg-muted/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
                  Utilisez le lien dédié <span className="font-semibold text-foreground">/admin</span>. Les comptes clients ne peuvent pas ouvrir cette plateforme.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-admin-email" className="text-xs">E-mail administrateur</Label>
                  <Input
                    id="auth-admin-email"
                    placeholder="admin@buildify.ci"
                    value={form.adminEmail}
                    onChange={event => set('adminEmail', event.target.value)}
                    type="email"
                    className="h-12"
                    autoComplete="username"
                  />
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    Exemple habilité : admin@buildify.ci, ou une adresse interne Buildify/Groupe EBC.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-admin-password" className="text-xs">Mot de passe</Label>
                  <Input
                    id="auth-admin-password"
                    value={form.adminPassword}
                    onChange={event => set('adminPassword', event.target.value)}
                    type="password"
                    className="h-12"
                    autoComplete="current-password"
                  />
                </div>
                <Button className="w-full h-12" type="submit" disabled={!form.adminEmail || !form.adminPassword || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Entrer dans l’admin
                </Button>
              </form>
            )}

            {displayMode === 'login' && (
              <form
                className="space-y-4"
                onSubmit={event => {
                  event.preventDefault();
                  handleLogin();
                }}
              >
                <div>
                  <h3 className="text-lg font-bold">Connexion</h3>
                  <p className="text-sm text-muted-foreground mt-1">E-mail recommandé, téléphone accepté.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-login-identifier" className="text-xs">E-mail ou téléphone</Label>
                  <Input
                    id="auth-login-identifier"
                    placeholder={`votre@email.ci ou ${getCountry(form.countryDialCode).example}`}
                    value={form.identifier}
                    onChange={event => set('identifier', event.target.value)}
                    className="h-12"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-login-country" className="text-xs">Pays du numéro</Label>
                  <select
                    id="auth-login-country"
                    value={form.countryDialCode}
                    onChange={event => set('countryDialCode', event.target.value)}
                    className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    {COUNTRY_CODES.map(country => (
                      <option key={`${country.code}-${country.dial}`} value={countryValue(country)}>
                        {country.name} ({country.dial})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">Si vous saisissez déjà un numéro avec +, l’indicatif saisi est conservé.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-login-password" className="text-xs">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="auth-login-password"
                      placeholder="Votre mot de passe"
                      value={form.password}
                      onChange={event => set('password', event.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      className="h-12 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full h-12" type="submit" disabled={!form.identifier || !form.password || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Se connecter
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    set('resetEmail', isEmail(form.identifier) ? form.identifier : form.resetEmail);
                    goMode('forgot');
                  }}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  Mot de passe oublié ?
                </button>
              </form>
            )}

            {displayMode === 'forgot' && (
              <form
                className="space-y-4"
                onSubmit={event => {
                  event.preventDefault();
                  handlePasswordReset();
                }}
              >
                <div>
                  <h3 className="text-lg font-bold">Mot de passe oublié</h3>
                  <p className="text-sm text-muted-foreground mt-1">Le lien de réinitialisation est envoyé uniquement par e-mail.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-reset-email" className="text-xs">Adresse e-mail</Label>
                  <Input
                    id="auth-reset-email"
                    placeholder="votre@email.ci"
                    value={form.resetEmail}
                    onChange={event => set('resetEmail', event.target.value)}
                    type="email"
                    className="h-12"
                    autoComplete="email"
                  />
                </div>
                <Button className="w-full h-12" type="submit" disabled={!form.resetEmail || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  Recevoir le lien
                </Button>
              </form>
            )}

            {displayMode === 'reset-sent' && (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="size-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">E-mail envoyé</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé.
                  </p>
                </div>
                <Button className="w-full h-12" onClick={() => goMode('login')}>
                  Retour à la connexion
                </Button>
              </div>
            )}

            {displayMode === 'register' && (
              <form
                className="space-y-4"
                onSubmit={event => {
                  event.preventDefault();
                  handleRegister();
                }}
              >
                <div>
                  <h3 className="text-lg font-bold">Créer un compte</h3>
                  <p className="text-sm text-muted-foreground mt-1">L'e-mail est recommandé pour récupérer le compte.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-register-name" className="text-xs">Nom complet</Label>
                  <Input id="auth-register-name" placeholder="Votre nom" value={form.name} onChange={event => set('name', event.target.value)} className="h-12" autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-register-email" className="text-xs">E-mail recommandé</Label>
                  <Input id="auth-register-email" placeholder="votre@email.ci" value={form.email} onChange={event => set('email', event.target.value)} type="email" className="h-12" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-register-phone" className="text-xs">Téléphone</Label>
                  <div className="grid grid-cols-[minmax(118px,0.45fr)_minmax(0,1fr)] gap-2">
                    <select
                      value={form.countryDialCode}
                      onChange={event => set('countryDialCode', event.target.value)}
                      className="h-12 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      aria-label="Pays du téléphone"
                    >
                      {COUNTRY_CODES.map(country => (
                        <option key={`${country.code}-${country.dial}`} value={countryValue(country)}>
                          {country.name} {country.dial}
                        </option>
                      ))}
                    </select>
                    <Input id="auth-register-phone" placeholder={getCountry(form.countryDialCode).example} value={form.phone} onChange={event => set('phone', event.target.value)} type="tel" className="h-12" autoComplete="tel" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-register-password" className="text-xs">Mot de passe</Label>
                  <Input id="auth-register-password" value={form.password} onChange={event => set('password', event.target.value)} type="password" className="h-12" autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-register-confirm-password" className="text-xs">Confirmer le mot de passe</Label>
                  <Input id="auth-register-confirm-password" value={form.confirmPassword} onChange={event => set('confirmPassword', event.target.value)} type="password" className="h-12" autoComplete="new-password" />
                </div>
                <Button className="w-full h-12" type="submit" disabled={!form.name || (!form.email && !form.phone) || !form.password || !form.confirmPassword || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Créer mon compte
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
  );
}
