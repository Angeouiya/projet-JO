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
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';

type AuthMode = 'choice' | 'login' | 'register' | 'forgot' | 'reset-sent';

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isPhone = (value: string) => /^\+?\d[\d\s().-]{7,}$/.test(value.trim());

function passwordError(password: string): string | null {
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (!/[A-Za-zÀ-ÿ]/.test(password)) return 'Ajoutez au moins une lettre.';
  if (!/\d/.test(password)) return 'Ajoutez au moins un chiffre.';
  return null;
}

export function AuthModal() {
  const { showAuthModal, dismissAuth, login } = useAppStore();
  const [mode, setMode] = useState<AuthMode>('choice');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    identifier: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    resetEmail: '',
  });

  if (!showAuthModal) return null;

  const set = (key: keyof typeof form, value: string) => {
    setError('');
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const goMode = (nextMode: AuthMode) => {
    setError('');
    setMode(nextMode);
  };

  const handleLogin = async () => {
    const identifier = form.identifier.trim();
    if (!identifier || (!isEmail(identifier) && !isPhone(identifier))) {
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
      name: form.name || 'Client BÂTI·CI',
      email: isEmail(identifier) ? identifier : undefined,
      phone: isPhone(identifier) && !isEmail(identifier) ? identifier : form.phone || undefined,
      type: 'client',
      role: 'client',
    });
    setLoading(false);
  };

  const handleRegister = async () => {
    const email = form.email.trim();
    const phone = form.phone.trim();
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
    if (!email && phone && !isPhone(phone)) {
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
    await new Promise(resolve => setTimeout(resolve, 700));
    setLoading(false);
    goMode('reset-sent');
  };

  const handleDemoLogin = () => {
    login({
      id: 'demo-admin-1',
      name: 'Diabaté Ibrahim',
      email: 'admin@bati.ci',
      phone: '+225 01 02 03 04',
      type: 'admin',
      role: 'super_admin',
    });
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
            {mode !== 'choice' ? (
              <button type="button" onClick={() => goMode('choice')} className="p-1 hover:bg-muted rounded-lg" aria-label="Retour">
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div />
            )}
            <h2 className="text-base font-semibold">BÂTI·CI</h2>
            <button type="button" onClick={dismissAuth} className="p-1 hover:bg-muted rounded-lg" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            {mode === 'choice' && (
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
                    <p className="mt-2 text-xs font-semibold">Téléphone possible</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Avec mot de passe.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full justify-start gap-3 h-12" onClick={() => goMode('login')}>
                    <LockKeyhole className="w-4 h-4" />
                    Se connecter
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={() => goMode('register')}>
                    <BadgeCheck className="w-4 h-4" />
                    Créer un compte
                  </Button>
                </div>

                <Separator />

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Accès démo administrateur
                </button>
              </div>
            )}

            {mode === 'login' && (
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
                  <Label className="text-xs">E-mail ou téléphone</Label>
                  <Input
                    placeholder="votre@email.ci ou +225 07 XX XX XX"
                    value={form.identifier}
                    onChange={event => set('identifier', event.target.value)}
                    className="h-12"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Mot de passe</Label>
                  <div className="relative">
                    <Input
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

            {mode === 'forgot' && (
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
                  <Label className="text-xs">Adresse e-mail</Label>
                  <Input
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

            {mode === 'reset-sent' && (
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

            {mode === 'register' && (
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
                  <Label className="text-xs">Nom complet</Label>
                  <Input placeholder="Votre nom" value={form.name} onChange={event => set('name', event.target.value)} className="h-12" autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">E-mail recommandé</Label>
                  <Input placeholder="votre@email.ci" value={form.email} onChange={event => set('email', event.target.value)} type="email" className="h-12" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Téléphone</Label>
                  <Input placeholder="+225 07 XX XX XX" value={form.phone} onChange={event => set('phone', event.target.value)} type="tel" className="h-12" autoComplete="tel" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Mot de passe</Label>
                  <Input value={form.password} onChange={event => set('password', event.target.value)} type="password" className="h-12" autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Confirmer le mot de passe</Label>
                  <Input value={form.confirmPassword} onChange={event => set('confirmPassword', event.target.value)} type="password" className="h-12" autoComplete="new-password" />
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
