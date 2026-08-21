'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';

export function AuthModal() {
  const { showAuthModal, dismissAuth, login, requireAuth } = useAppStore();
  const [mode, setMode] = useState<'choice' | 'login' | 'register' | 'otp'>('choice');
  const [method, setMethod] = useState<'email' | 'phone'>('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', otp: '' });

  if (!showAuthModal) return null;

  const handlePhoneLogin = async () => {
    if (!form.phone) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setMode('otp');
    setLoading(false);
  };

  const handleEmailLogin = async () => {
    if (!form.email || !form.password) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    login({
      id: 'demo-user-1',
      name: form.name || 'Utilisateur',
      email: form.email,
      phone: form.phone || undefined,
      type: 'client',
      role: 'client',
    });
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!form.name || !form.phone) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    login({
      id: 'demo-user-new',
      name: form.name,
      email: form.email || undefined,
      phone: form.phone,
      type: 'client',
      role: 'client',
    });
    setLoading(false);
  };

  const handleOtpVerify = async () => {
    if (form.otp.length < 4) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    login({
      id: 'demo-user-phone',
      name: 'Utilisateur',
      phone: form.phone,
      type: 'client',
      role: 'client',
    });
    setLoading(false);
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

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
        onClick={dismissAuth}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-border">
            {mode !== 'choice' ? (
              <button onClick={() => setMode('choice')} className="p-1 hover:bg-muted rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : <div />}
            <h2 className="text-base font-semibold">BÂTI·CI</h2>
            <button onClick={dismissAuth} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Choice Screen */}
            {mode === 'choice' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold">Bienvenue</h3>
                  <p className="text-sm text-muted-foreground mt-1">Connectez-vous pour continuer</p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => { setMode('login'); setMethod('phone'); }}
                  >
                    <Phone className="w-4 h-4" /> Téléphone
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => { setMode('login'); setMethod('email'); }}
                  >
                    <Mail className="w-4 h-4" /> E-mail
                  </Button>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => { setMode('register'); }}
                  >
                    Créer un compte
                  </Button>
                </div>

                <Separator />

                <button
                  onClick={handleDemoLogin}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Accès démo administrateur →
                </button>
              </div>
            )}

            {/* Phone Login */}
            {mode === 'login' && method === 'phone' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Connexion par téléphone</h3>
                  <p className="text-sm text-muted-foreground mt-1">Entrez votre numéro +225</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Numéro de téléphone</Label>
                  <Input
                    placeholder="+225 07 XX XX XX"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    type="tel"
                    className="h-12"
                  />
                </div>
                <Button className="w-full h-12" onClick={handlePhoneLogin} disabled={!form.phone || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Envoyer le code
                </Button>
              </div>
            )}

            {/* Email Login */}
            {mode === 'login' && method === 'email' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold">Connexion par e-mail</h3>
                  <p className="text-sm text-muted-foreground mt-1">Entrez vos identifiants</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Adresse e-mail</Label>
                  <Input
                    placeholder="votre@email.ci"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    type="email"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      className="h-12 pr-10"
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full h-12" onClick={handleEmailLogin} disabled={!form.email || !form.password || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Se connecter
                </Button>
                <button className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* OTP Verification */}
            {mode === 'otp' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold">Vérification</h3>
                  <p className="text-sm text-muted-foreground mt-1">Entrez le code envoyé au {form.phone}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Code OTP</Label>
                  <Input
                    placeholder="0000"
                    value={form.otp}
                    onChange={e => set('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={6}
                  />
                </div>
                <Button className="w-full h-12" onClick={handleOtpVerify} disabled={form.otp.length < 4 || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Vérifier
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Pas reçu ? <button className="text-foreground font-medium">Renvoyer</button>
                </p>
              </div>
            )}

            {/* Register */}
            {mode === 'register' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold">Créer un compte</h3>
                  <p className="text-sm text-muted-foreground mt-1">Rejoignez BÂTI·CI</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Nom complet</Label>
                  <Input placeholder="Votre nom" value={form.name} onChange={e => set('name', e.target.value)} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Téléphone (+225)</Label>
                  <Input placeholder="+225 07 XX XX XX" value={form.phone} onChange={e => set('phone', e.target.value)} type="tel" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">E-mail (optionnel)</Label>
                  <Input placeholder="votre@email.ci" value={form.email} onChange={e => set('email', e.target.value)} type="email" className="h-12" />
                </div>
                <Button className="w-full h-12" onClick={handleRegister} disabled={!form.name || !form.phone || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Créer mon compte
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}