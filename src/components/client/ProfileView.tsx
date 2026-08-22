'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, FolderArchive, Settings, HelpCircle, LogOut, Shield,
  ChevronRight, Bell, User, Mail, Phone, PenLine, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useAppStore } from '@/stores/app-store';

const MENU_ITEMS = [
  { icon: Bell, label: 'Notifications', view: 'notifications' as const, showArrow: true },
  { icon: Heart, label: 'Mes favoris', view: 'favorites' as const, showArrow: true },
  { icon: FolderArchive, label: 'Mes documents', view: 'projects' as const, showArrow: true },
  { icon: Settings, label: 'Paramètres', view: 'projects' as const, showArrow: true },
  { icon: HelpCircle, label: 'Aide', view: 'projects' as const, showArrow: true },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

export function ProfileView() {
  const { user, isAdmin, navigate, logout } = useAppStore();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  const displayName = user?.name || 'Utilisateur';
  const displayEmail = user?.email || 'email@exemple.com';
  const displayPhone = user?.phone || '+225 00 00 00 00';
  const initials = getInitials(displayName);

  const handleSaveProfile = () => {
    setEditOpen(false);
  };

  const menuVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3 },
    }),
  };

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold tracking-tight"
        >
          Mon profil
        </motion.h1>
      </div>

      {/* Avatar + Info Card */}
      <div className="px-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="py-0 gap-0">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="size-20 rounded-full bg-foreground flex items-center justify-center">
                <span className="text-2xl font-bold text-background">{initials}</span>
              </div>
              <h2 className="mt-4 text-lg font-bold">{displayName}</h2>
              <p className="text-sm text-muted-foreground mt-1">{user?.role || 'Client'}</p>

              <Separator className="my-4" />

              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Nom complet</p>
                    <p className="text-sm font-medium truncate">{displayName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Mail className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">E-mail</p>
                    <p className="text-sm font-medium truncate">{displayEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Phone className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-medium truncate">{displayPhone}</p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-5 gap-2 w-full"
                onClick={() => setEditOpen(true)}
              >
                <PenLine className="size-4" />
                Modifier le profil
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Admin button */}
      {isAdmin && (
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card
              className="py-0 gap-0 cursor-pointer hover:bg-accent/50 transition-colors border-dashed"
              onClick={() => navigate('admin')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="size-9 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
                  <Shield className="size-4 text-background" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Administration</p>
                  <p className="text-[11px] text-muted-foreground">Accéder au panneau d'administration</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Menu items */}
      <div className="px-4 mt-6">
        <Card className="py-0 gap-0 overflow-hidden">
          {MENU_ITEMS.map((item, i) => (
            <motion.button
              key={item.label}
              custom={i}
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
              onClick={() => navigate(item.view)}
            >
              <item.icon className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.showArrow && <ChevronRight className="size-4 text-muted-foreground/50" />}
            </motion.button>
          ))}

          <Separator />

          <ConfirmActionDialog
            title="Se déconnecter ?"
            description="Votre session Buildify sera fermée sur cet appareil. Vous pourrez vous reconnecter avec votre e-mail ou numéro de téléphone et votre mot de passe."
            confirmLabel="Se déconnecter"
            onConfirm={logout}
            trigger={(
              <button
                type="button"
                className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
              >
                <LogOut className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium flex-1">Déconnexion</span>
              </button>
            )}
          />
        </Card>
      </div>

      {/* Version info */}
      <div className="mt-8 text-center">
        <p className="text-[11px] text-muted-foreground/50">Buildify v1.0.0</p>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="size-4" />
              Modifier le profil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom complet</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+225 XX XX XX XX"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveProfile}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
