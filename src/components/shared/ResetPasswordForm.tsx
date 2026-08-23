'use client';

import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email || !token) {
      setError('Le lien de réinitialisation est incomplet.');
      return;
    }
    if (password.length < 8 || !/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) {
      setError('Utilisez au moins 8 caractères, avec une lettre et un chiffre.');
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const response = await fetch('/api/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, password }),
    });
    const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    setLoading(false);
    if (!response.ok) {
      setError(payload?.message || payload?.error || 'La réinitialisation a échoué.');
      return;
    }
    setSuccess(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex justify-center"><BrandLogo size="sm" /></div>
        {success ? (
          <div className="mt-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-lg bg-muted">
              <CheckCircle2 className="size-7" />
            </span>
            <h1 className="mt-5 text-xl font-bold">Mot de passe modifié</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Toutes les anciennes sessions ont été fermées. Vous pouvez vous reconnecter.</p>
            <Button className="mt-6 h-12 w-full" onClick={() => window.location.assign('/client')}>Ouvrir la connexion</Button>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={submit}>
            <div>
              <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Le lien est valable une heure et ne peut être utilisé qu’une fois.</p>
            </div>
            {error && <div className="rounded-lg border bg-muted/40 px-4 py-3 text-xs font-medium leading-5">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="h-12 pr-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmation}
                onChange={event => setConfirmation(event.target.value)}
                className="h-12"
                autoComplete="new-password"
              />
            </div>
            <Button className="h-12 w-full" type="submit" disabled={loading || !password || !confirmation}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <LockKeyhole className="mr-2 size-4" />}
              Enregistrer le mot de passe
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
