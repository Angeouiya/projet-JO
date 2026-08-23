'use client';

import { useMemo, useState } from 'react';
import {
  Search, Phone, Mail, ChevronDown, ChevronUp, Plus, User as UserIcon, FolderKanban, MessageSquareText, StickyNote, Send,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/stores/app-store';
import { FORMAT_XOF, PROJECT_STATUS_LABELS } from '@/types';
import { AdminCreateProjectDialog } from './AdminCreateProjectDialog';
import type { AdminClientData, ProjectData } from '@/types';

type AdminClientRow = AdminClientData;

type ClientDraft = Pick<AdminClientRow, 'name' | 'type' | 'phone' | 'email' | 'city' | 'notes'>;

const TYPE_LABELS: Record<string, string> = {
  particulier: 'Particulier',
  entreprise: 'Entreprise',
  promoteur: 'Promoteur',
  institution: 'Institution',
};

const TYPE_OPTIONS = Object.keys(TYPE_LABELS);

function formatDate(value?: string) {
  if (!value) return 'Non daté';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
}

function projectTotal(project: ProjectData) {
  return project.budgetMax || project.budgetMin || 0;
}

function clientKey(project: ProjectData) {
  return (project.clientEmail || project.clientPhone || project.clientName || project.userId || project.id).toLowerCase();
}

function buildWorkflowClients(projects: ProjectData[]): AdminClientRow[] {
  const grouped = new Map<string, AdminClientRow>();

  projects.forEach(project => {
    const key = clientKey(project);
    const existing = grouped.get(key);
    const amount = projectTotal(project);
    const updatedAt = project.updatedAt || project.createdAt;
    if (existing) {
      existing.projects += 1;
      existing.totalSpent += amount;
      existing.projectIds.push(project.id);
      existing.lastActivity = formatDate(updatedAt);
      if (project.city && !existing.city) existing.city = project.city;
      if (project.categoryName && !existing.tags.includes(project.categoryName)) existing.tags.push(project.categoryName);
      return;
    }

    grouped.set(key, {
      id: `workflow-${key.replace(/[^a-z0-9]/g, '-').slice(0, 32)}`,
      name: project.clientName || 'Client Buildify',
      type: 'particulier',
      phone: project.clientPhone,
      email: project.clientEmail,
      projects: 1,
      totalSpent: amount,
      city: project.city,
      lastActivity: formatDate(updatedAt),
      tags: [project.categoryName || 'Workflow'],
      notes: project.missingInfo || '',
      projectIds: [project.id],
    });
  });

  return Array.from(grouped.values());
}

function matchesClient(client: AdminClientRow, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    client.name,
    client.email,
    client.phone,
    client.city,
    client.notes,
    TYPE_LABELS[client.type],
    ...client.tags,
  ].some(value => value?.toLowerCase().includes(needle));
}

export function AdminClients() {
  const {
    navigate,
    userProjects,
    addToast,
    addNotification,
    adminClients,
    adminClientNotes,
    addAdminClient,
    setAdminClientNote,
  } = useAppStore();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [projectPanelClientId, setProjectPanelClientId] = useState<string | null>(null);
  const [noteClientId, setNoteClientId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [messageClient, setMessageClient] = useState<AdminClientRow | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<ClientDraft>({
    name: '',
    type: 'particulier',
    phone: '',
    email: '',
    city: '',
    notes: '',
  });

  const workflowClients = useMemo(
    () => buildWorkflowClients(userProjects).map(client => ({
      ...client,
      notes: adminClientNotes[client.id] ?? client.notes,
    })),
    [adminClientNotes, userProjects]
  );
  const clients = useMemo(() => {
    const workflowKeys = new Set(workflowClients.map(client => (client.email || client.phone || client.name).toLowerCase()));
    const remainingManual = adminClients
      .filter(client => !workflowKeys.has((client.email || client.phone || client.name).toLowerCase()))
      .map(client => ({
        ...client,
        notes: adminClientNotes[client.id] ?? client.notes,
      }));
    return [...workflowClients, ...remainingManual];
  }, [adminClientNotes, adminClients, workflowClients]);

  const projectsById = useMemo(() => new Map(userProjects.map(project => [project.id, project])), [userProjects]);
  const filtered = clients.filter(client => matchesClient(client, search));

  const resetDraft = () => setDraft({
    name: '',
    type: 'particulier',
    phone: '',
    email: '',
    city: '',
    notes: '',
  });

  const handleAddClient = () => {
    if (!draft.name.trim()) {
      addToast('Le nom du client est obligatoire.', 'error');
      return;
    }

    const client: AdminClientRow = {
      id: `manual-client-${Date.now()}`,
      name: draft.name.trim(),
      type: draft.type,
      phone: draft.phone?.trim() || undefined,
      email: draft.email?.trim() || undefined,
      city: draft.city?.trim() || undefined,
      notes: draft.notes?.trim() || '',
      projects: 0,
      totalSpent: 0,
      lastActivity: 'Créé maintenant',
      tags: ['Nouveau'],
      projectIds: [],
    };

    addAdminClient(client);
    setExpandedId(client.id);
    setAddOpen(false);
    resetDraft();
    addToast('Client ajouté à la plateforme admin.', 'success');
  };

  const updateNoteDraft = (clientId: string, notes: string) => {
    setNoteDrafts(prev => ({ ...prev, [clientId]: notes }));
  };

  const saveClientNote = (client: AdminClientRow) => {
    const notes = (noteDrafts[client.id] ?? client.notes).trim();
    setAdminClientNote(client.id, notes);
    setNoteDrafts(prev => {
      const { [client.id]: _saved, ...rest } = prev;
      return rest;
    });
    addToast('Note client enregistrée dans la plateforme admin.', 'success');
  };

  const openProjectsPanel = (client: AdminClientRow) => {
    setExpandedId(client.id);
    setProjectPanelClientId(current => current === client.id ? null : client.id);
  };

  const openMessageDialog = (client: AdminClientRow) => {
    setMessageClient(client);
    setMessageBody(`Bonjour ${client.name}, `);
  };

  const sendMessage = () => {
    if (!messageClient || !messageBody.trim()) {
      addToast('Le message ne peut pas être vide.', 'error');
      return;
    }

    addNotification({
      title: `Message admin à ${messageClient.name}`,
      message: messageBody.trim(),
      type: 'message',
      audience: 'client',
      link: 'messages',
      actionLabel: 'Lire',
    });
    setMessageClient(null);
    setMessageBody('');
    addToast('Message enregistré et notifié.', 'success');
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">Clients admin</h1>
          <p className="text-sm text-muted-foreground">{clients.length} clients dans la plateforme admin</p>
        </div>
        <Button size="sm" className="w-full gap-2 sm:w-auto" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Nom, e-mail, téléphone, ville..." value={search} onChange={event => setSearch(event.target.value)} className="h-11 pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.map(client => {
          const relatedProjects = client.projectIds
            .map(projectId => projectsById.get(projectId))
            .filter(Boolean) as ProjectData[];
          const expanded = expandedId === client.id;
          const showProjects = projectPanelClientId === client.id;
          const showNotes = noteClientId === client.id;

          return (
            <Card key={client.id} className="py-0 transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 text-left"
                  onClick={() => setExpandedId(expanded ? null : client.id)}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <UserIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{client.name}</p>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">{TYPE_LABELS[client.type]}</Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{client.projects} projet{client.projects > 1 ? 's' : ''}</span>
                      <span>{FORMAT_XOF(client.totalSpent)}</span>
                      <span>{client.lastActivity}</span>
                    </div>
                  </div>
                  <div className="hidden min-w-0 items-center gap-3 text-xs text-muted-foreground lg:flex">
                    {client.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{client.phone}</span>}
                    {client.email && <span className="flex min-w-0 items-center gap-1"><Mail className="size-3 shrink-0" /><span className="truncate">{client.email}</span></span>}
                  </div>
                  {expanded ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
                </button>

                {expanded && (
                  <div>
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                          <div><p className="text-xs text-muted-foreground">Téléphone</p><p className="mt-0.5 break-words">{client.phone || 'À renseigner'}</p></div>
                          <div><p className="text-xs text-muted-foreground">E-mail</p><p className="mt-0.5 break-words">{client.email || 'À renseigner'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Ville</p><p className="mt-0.5">{client.city || 'À préciser'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Type</p><p className="mt-0.5">{TYPE_LABELS[client.type]}</p></div>
                        </div>

                        {client.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {client.tags.map(tag => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                          </div>
                        )}

                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          <Button size="sm" variant="outline" className="justify-start gap-2" onClick={() => openProjectsPanel(client)}>
                            <FolderKanban className="size-4" />
                            Voir les projets
                          </Button>
                          <Button size="sm" variant="outline" className="justify-start gap-2" onClick={() => openMessageDialog(client)}>
                            <MessageSquareText className="size-4" />
                            Envoyer un message
                          </Button>
                          <Button size="sm" variant="outline" className="justify-start gap-2" onClick={() => setNoteClientId(showNotes ? null : client.id)}>
                            <StickyNote className="size-4" />
                            Notes
                          </Button>
                        </div>

                        {showProjects && (
                          <div className="mt-4 rounded-lg border p-3">
                              <div className="flex items-center gap-2">
                                <FolderKanban className="size-4 text-muted-foreground" />
                                <p className="text-sm font-semibold">Projets liés</p>
                              </div>
                              {relatedProjects.length === 0 ? (
                                <div className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                  Aucun dossier réel n’est rattaché à ce client. Créez un dossier admin pour alimenter cette vue.
                                  <AdminCreateProjectDialog
                                    defaults={{
                                      clientName: client.name,
                                      clientEmail: client.email,
                                      clientPhone: client.phone,
                                      city: client.city,
                                    }}
                                    trigger={(
                                      <Button className="mt-3 h-9 w-full rounded-lg">
                                        Créer un dossier
                                      </Button>
                                    )}
                                  />
                                </div>
                              ) : (
                                <div className="mt-3 space-y-2">
                                  {relatedProjects.map(project => (
                                    <button
                                      key={project.id}
                                      type="button"
                                      className="flex w-full flex-col gap-1 rounded-lg border p-3 text-left hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                                      onClick={() => navigate('admin-project-detail', { id: project.id })}
                                    >
                                      <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold">{project.title || project.referenceNumber}</span>
                                        <span className="text-xs text-muted-foreground">{project.referenceNumber} · {project.city || 'Ville à préciser'}</span>
                                      </span>
                                      <Badge variant="outline" className="w-fit">{PROJECT_STATUS_LABELS[project.status] || project.status}</Badge>
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>
                        )}

                        {showNotes && (
                          <div className="mt-4 rounded-lg border p-3">
                              <Label htmlFor={`note-${client.id}`} className="text-xs">Note interne admin</Label>
                              <Textarea
                                id={`note-${client.id}`}
                                value={noteDrafts[client.id] ?? client.notes}
                                onChange={event => updateNoteDraft(client.id, event.target.value)}
                                placeholder="Ajouter une note visible uniquement dans la plateforme admin..."
                                className="mt-2 min-h-24"
                              />
                              <Button size="sm" className="mt-3" onClick={() => saveClientNote(client)}>Enregistrer la note</Button>
                          </div>
                        )}
                      </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un client admin</DialogTitle>
            <DialogDescription>Créez une fiche client indépendante. Les dossiers réels viendront ensuite s’y rattacher par e-mail ou téléphone.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client-name">Nom</Label>
              <Input id="client-name" value={draft.name} onChange={event => setDraft(prev => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-type">Type</Label>
              <select id="client-type" value={draft.type} onChange={event => setDraft(prev => ({ ...prev, type: event.target.value }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {TYPE_OPTIONS.map(type => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-city">Ville</Label>
              <Input id="client-city" value={draft.city || ''} onChange={event => setDraft(prev => ({ ...prev, city: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">E-mail</Label>
              <Input id="client-email" type="email" value={draft.email || ''} onChange={event => setDraft(prev => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Téléphone</Label>
              <Input id="client-phone" value={draft.phone || ''} onChange={event => setDraft(prev => ({ ...prev, phone: event.target.value }))} placeholder="+225 ..." />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client-notes">Note initiale</Label>
              <Textarea id="client-notes" value={draft.notes || ''} onChange={event => setDraft(prev => ({ ...prev, notes: event.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button onClick={handleAddClient}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!messageClient} onOpenChange={open => !open && setMessageClient(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Envoyer un message</DialogTitle>
            <DialogDescription>{messageClient ? `${messageClient.name} · ${messageClient.email || messageClient.phone || 'contact à compléter'}` : ''}</DialogDescription>
          </DialogHeader>
          <Textarea value={messageBody} onChange={event => setMessageBody(event.target.value)} className="min-h-32" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageClient(null)}>Annuler</Button>
            <Button className="gap-2" onClick={sendMessage}>
              <Send className="size-4" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
