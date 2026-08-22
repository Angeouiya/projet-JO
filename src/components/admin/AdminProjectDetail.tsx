'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FolderSearch,
  Landmark,
  MessageSquareText,
  ReceiptText,
  Send,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';
import { FORMAT_XOF, PROJECT_STATUS_LABELS } from '@/types';
import { formatProjectLocation } from '@/lib/project-format';

const TEAM_LEADS = ['Awa Kouadio', 'Moussa Traoré', 'Ibrahim Diarra', 'Fatou Koné'];

function formatBudget(min?: number, max?: number) {
  if (min && max) return `${FORMAT_XOF(min)} - ${FORMAT_XOF(max)}`;
  if (max) return FORMAT_XOF(max);
  if (min) return FORMAT_XOF(min);
  return 'À estimer';
}

function quoteStatusLabel(status: string) {
  if (status === 'sent') return 'Transmis';
  if (status === 'accepted') return 'Accepté';
  if (status === 'refused') return 'Refusé';
  return 'Brouillon';
}

function financingModeLabel(mode?: string) {
  const labels: Record<string, string> = {
    'confirmed-bank': 'Financement confirmé',
    'bank-support': 'Aide banque demandée',
    'progress-payment': 'Paiement par avancement',
    'notary-secured': 'Contrat notarié',
    'land-and-finance': 'Terrain + financement',
    'to-structure': 'À structurer',
  };
  return mode ? labels[mode] || mode : 'À structurer';
}

function financingReadinessLabel(readiness?: string) {
  if (readiness === 'confirmed') return 'Confirmé';
  if (readiness === 'bank_review') return 'Banque à suivre';
  if (readiness === 'to_structure') return 'À structurer';
  return 'À confirmer';
}

function amountOrTodo(value: number | undefined) {
  return value !== undefined ? FORMAT_XOF(value) : 'À compléter';
}

function percentOrTodo(value: number | undefined) {
  return value !== undefined ? `${value}%` : 'À calculer';
}

const BANK_STAGE_LABELS: Record<string, string> = {
  'not-started': 'Pas démarré',
  simulation: 'Simulation reçue',
  'documents-requested': 'Pièces demandées',
  'under-review': 'En étude',
  'pre-approved': 'Préaccord',
  'funds-available': 'Fonds disponibles',
};

const FINANCING_DOCUMENT_LABELS: Record<string, string> = {
  id: 'Identité',
  'income-proof': 'Revenus',
  'bank-statements': 'Relevés',
  'land-document': 'Terrain',
  'company-documents': 'Entreprise',
  'quote-or-plans': 'Plans/devis',
  'none-yet': 'Aucun',
};

function labelFrom(labels: Record<string, string>, value?: string) {
  if (!value) return 'À compléter';
  return labels[value] || value;
}

export function AdminProjectDetail() {
  const {
    goBack,
    viewParams,
    userProjects,
    assignProjectLead,
    requestProjectInfo,
    sendProjectQuote,
    updateProjectStatus,
    addToast,
  } = useAppStore();
  const projectId = viewParams?.id || '';
  const project = useMemo(
    () => userProjects.find(item => item.id === projectId || item.referenceNumber === projectId),
    [projectId, userProjects]
  );
  const [leadName, setLeadName] = useState(project?.assignedTo || TEAM_LEADS[0]);
  const [infoMessage, setInfoMessage] = useState(project?.missingInfo || 'Merci de compléter les dimensions du terrain et le document foncier disponible.');
  const [quoteAmount, setQuoteAmount] = useState(project?.budgetMax || project?.budgetMin || 0);

  if (!project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-lg border-dashed">
          <CardContent className="p-8 text-center">
            <FolderSearch className="mx-auto size-10 text-muted-foreground" />
            <h1 className="mt-4 text-lg font-semibold">Dossier non synchronisé</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Ce dossier n’existe pas dans le workflow persistant de ce navigateur.
            </p>
            <Button className="mt-5" variant="outline" onClick={goBack}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status;
  const quoteDisabled = !Number.isFinite(Number(quoteAmount)) || Number(quoteAmount) <= 0;
  const financing = project.financing || (project.formData?.financing as typeof project.financing);
  const visualProposal = project.visualProposal;
  const locationLabel = formatProjectLocation(project);

  const handleAssign = () => {
    if (!leadName.trim()) return;
    assignProjectLead(project.id, leadName.trim());
    addToast('Responsable affecté au dossier.', 'success');
  };

  const handleInfoRequest = () => {
    if (!infoMessage.trim()) return;
    requestProjectInfo(project.id, infoMessage.trim());
    addToast('Demande d’information envoyée au client.', 'success');
  };

  const handleQuote = () => {
    if (quoteDisabled) return;
    sendProjectQuote(project.id, Number(quoteAmount), `Devis ${project.categoryName || 'BTP'}`);
    addToast('Devis transmis au client.', 'success');
  };

  const handlePlanning = () => {
    updateProjectStatus(project.id, 'planning', 'Projet passé en planification');
    addToast('Projet passé en planification.', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="mb-2 gap-2 px-0 hover:bg-transparent" onClick={goBack}>
            <ArrowLeft className="size-4" />
            Retour
          </Button>
          <p className="text-xs font-mono text-muted-foreground">{project.referenceNumber}</p>
          <h1 className="mt-1 truncate text-2xl font-bold">{project.title || project.modelName || 'Dossier BTP'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{project.clientName || 'Client Buildify'} · {locationLabel}</p>
        </div>
        <Badge className="w-fit">{statusLabel}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Budget</p>
            <p className="mt-2 text-sm font-semibold">{formatBudget(project.budgetMin, project.budgetMax)}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</p>
            <p className="mt-2 text-sm font-semibold">{project.categoryName || 'Projet BTP'}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Responsable</p>
            <p className="mt-2 text-sm font-semibold">{project.assignedTo || 'À affecter'}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Avancement</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="mt-3 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold">Actions dossier</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="leadName">
                    Responsable
                  </label>
                  <select
                    id="leadName"
                    value={leadName}
                    onChange={(event) => setLeadName(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {TEAM_LEADS.map(lead => <option key={lead} value={lead}>{lead}</option>)}
                  </select>
                  <Button className="mt-3 w-full gap-2" onClick={handleAssign}>
                    <UserCheck className="size-4" />
                    Affecter
                  </Button>
                </div>

                <div className="rounded-lg border p-3">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="quoteAmount">
                    Devis
                  </label>
                  <Input
                    id="quoteAmount"
                    type="number"
                    min={1}
                    value={quoteAmount || ''}
                    onChange={(event) => setQuoteAmount(Number(event.target.value))}
                    className="mt-2"
                  />
                  <Button className="mt-3 w-full gap-2" onClick={handleQuote} disabled={quoteDisabled}>
                    <ReceiptText className="size-4" />
                    Transmettre
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="infoMessage">
                Information complémentaire
              </label>
              <Textarea
                id="infoMessage"
                value={infoMessage}
                onChange={(event) => setInfoMessage(event.target.value)}
                className="mt-2 min-h-24"
              />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button className="gap-2" onClick={handleInfoRequest} disabled={!infoMessage.trim()}>
                  <MessageSquareText className="size-4" />
                  Demander au client
                </Button>
                <Button variant="outline" className="gap-2" onClick={handlePlanning}>
                  <ClipboardCheck className="size-4" />
                  Passer en planification
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold">Journal d’activité</h2>
              <div className="mt-3 divide-y">
                {(project.activityLog ?? []).length === 0 ? (
                  <p className="py-6 text-sm text-muted-foreground">Aucune activité enregistrée.</p>
                ) : (
                  (project.activityLog ?? []).map(item => (
                    <div key={item.id} className="flex items-start gap-3 py-3">
                      <span className="mt-1 size-2 rounded-full bg-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.actor} · {new Date(item.createdAt).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Financement</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{financingReadinessLabel(financing?.readiness)}</p>
                </div>
                <Landmark className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-3 grid gap-2">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mode</p>
                  <p className="mt-1 text-sm font-semibold">{financingModeLabel(financing?.mode)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Revenu</p>
                    <p className="mt-1 text-xs font-semibold">{amountOrTodo(financing?.monthlyIncome)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Apport</p>
                    <p className="mt-1 text-xs font-semibold">{amountOrTodo(financing?.ownContribution)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mensualité</p>
                    <p className="mt-1 text-xs font-semibold">{amountOrTodo(financing?.monthlyPaymentCapacity)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ratio projeté</p>
                    <p className="mt-1 text-xs font-semibold">{percentOrTodo(financing?.projectedDebtRatioPercent)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prêt demandé</p>
                    <p className="mt-1 text-xs font-semibold">{amountOrTodo(financing?.requestedLoanAmount)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Accord banque</p>
                    <p className="mt-1 text-xs font-semibold">{labelFrom(BANK_STAGE_LABELS, financing?.bankAgreementStage)}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Banque</p>
                  <p className="mt-1 text-sm font-semibold">{financing?.bankName || 'À contacter'}</p>
                  {financing?.bankContact && <p className="mt-1 text-xs text-muted-foreground">{financing.bankContact}</p>}
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pièces déclarées</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(financing?.documentReadiness?.length ? financing.documentReadiness : ['none-yet']).map(item => (
                      <Badge key={item} variant="outline" className="text-[10px]">
                        {labelFrom(FINANCING_DOCUMENT_LABELS, item)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={financing?.notaryContract ? 'default' : 'outline'} className="gap-1">
                    <ShieldCheck className="size-3" />
                    Notaire
                  </Badge>
                  <Badge variant={financing?.bankSupportRequested ? 'default' : 'outline'} className="gap-1">
                    <Landmark className="size-3" />
                    Banque
                  </Badge>
                  <Badge variant={financing?.escrowRequested ? 'default' : 'outline'} className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Séquestre
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold">Proposition visuelle retenue</h2>
              {visualProposal ? (
                <div className="mt-3 rounded-lg border p-3">
                  <p className="text-sm font-semibold">{visualProposal.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{visualProposal.category} · {new Date(visualProposal.validatedAt).toLocaleString('fr-FR')}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{visualProposal.deliverable}</p>
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Le client n’a pas encore validé de proposition visuelle.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold">Documents</h2>
              <div className="mt-3 space-y-2">
                {(project.documents ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Aucun document déclaré.</p>
                ) : (
                  (project.documents ?? []).map(document => (
                    <div key={document.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <FolderSearch className="size-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{document.name}</p>
                        <p className="text-xs text-muted-foreground">{document.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold">Devis transmis</h2>
              <div className="mt-3 space-y-2">
                {(project.quotes ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Aucun devis transmis.</p>
                ) : (
                  (project.quotes ?? []).map(quote => (
                    <div key={quote.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{quote.label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{quote.date}</p>
                        </div>
                        <Badge variant="secondary">{quoteStatusLabel(quote.status)}</Badge>
                      </div>
                      <p className="mt-3 text-sm font-bold">{FORMAT_XOF(quote.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {project.missingInfo && (
            <Card className="py-0 gap-0">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Send className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <h2 className="text-sm font-semibold">Info demandée</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{project.missingInfo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
