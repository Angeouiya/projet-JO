import { FORMAT_XOF, PROJECT_STATUS_LABELS } from '@/types';
import type { ProjectData, ProjectFinancingData } from '@/types';
import { buildFinancingDecisionPlan } from '@/lib/financing-decision';
import { buildProjectBrief, projectBriefLabel } from '@/lib/project-brief';
import { formatProjectLocation } from '@/lib/project-format';
import {
  formatProjectScheduleDate,
  projectScheduleModeLabel,
  projectScheduleStatusLabel,
  projectScheduleTypeLabel,
  sortProjectSchedule,
} from '@/lib/project-schedule';

export type ProjectDossierMode = 'client' | 'admin';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeText(value: unknown, fallback = 'À compléter') {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function money(value?: number) {
  return value !== undefined ? FORMAT_XOF(value) : 'À calculer';
}

function percent(value?: number) {
  return value !== undefined ? `${value}%` : 'À calculer';
}

function formatDate(value?: string) {
  if (!value) return 'À dater';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function absoluteUrl(url: string, origin: string) {
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  try {
    return new URL(url, origin).href;
  } catch {
    return url;
  }
}

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function getProjectFinancing(project: ProjectData) {
  return project.financing || (project.formData?.financing as ProjectFinancingData | undefined);
}

function getField(project: ProjectData, key: string) {
  return safeText((project as unknown as Record<string, unknown>)[key] ?? project.formData?.[key], '');
}

function list(items: string[]) {
  const visibleItems = items.filter(Boolean);
  if (visibleItems.length === 0) return '<p class="muted">Aucun élément renseigné.</p>';
  return `<ul>${visibleItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function pills(items: string[]) {
  const visibleItems = items.filter(Boolean);
  if (visibleItems.length === 0) return '<span class="pill">À compléter</span>';
  return visibleItems.map(item => `<span class="pill">${escapeHtml(item)}</span>`).join('');
}

function cells(items: Array<{ label: string; value: string; help?: string }>) {
  return items.map(item => `
    <div class="cell">
      <div class="label">${escapeHtml(item.label)}</div>
      <div class="value">${escapeHtml(item.value)}</div>
      ${item.help ? `<div class="help">${escapeHtml(item.help)}</div>` : ''}
    </div>
  `).join('');
}

function statusLabel(status: string) {
  return PROJECT_STATUS_LABELS[status] || projectBriefLabel(status) || status;
}

function quoteStatusLabel(status: string) {
  if (status === 'sent') return 'Transmis';
  if (status === 'accepted') return 'Accepté';
  if (status === 'refused') return 'Refusé';
  return 'Brouillon';
}

function milestoneStatusLabel(status: string) {
  if (status === 'due') return 'À régler';
  if (status === 'paid') return 'Payé';
  if (status === 'blocked') return 'Bloqué';
  return 'Planifié';
}

function financingReadinessLabel(readiness?: string) {
  if (readiness === 'confirmed') return 'Confirmé';
  if (readiness === 'bank_review') return 'Banque à suivre';
  if (readiness === 'to_structure') return 'À structurer';
  return 'À confirmer';
}

function renderVisualProposal(project: ProjectData, origin: string) {
  const proposal = project.visualProposal || project.visualProposals?.[0];
  if (!proposal) {
    return '<p class="muted">Aucune proposition visuelle validée ou publiée dans ce dossier.</p>';
  }

  return `
    <div class="visual">
      <img src="${escapeHtml(absoluteUrl(proposal.image, origin))}" alt="${escapeHtml(proposal.title)}" />
      <div>
        <div class="label">Proposition visuelle</div>
        <h3>${escapeHtml(proposal.title)}</h3>
        <p>${escapeHtml(proposal.description)}</p>
        <div class="mini-grid">
          ${cells([
            { label: 'Budget indicatif', value: proposal.estimate },
            { label: 'Délai', value: proposal.duration },
            { label: 'Confiance', value: proposal.confidence },
            { label: 'Livrable', value: proposal.deliverable },
          ])}
        </div>
      </div>
    </div>
    <div class="split">
      <div class="box"><div class="label">Points forts</div>${list(proposal.strengths ?? [])}</div>
      <div class="box"><div class="label">Contrôles avant devis</div>${list(proposal.riskControls ?? [])}</div>
    </div>
  `;
}

function renderFinancing(project: ProjectData) {
  const financing = getProjectFinancing(project);
  if (!financing) {
    return '<p class="muted">Aucune fiche financière détaillée n’est encore rattachée au projet.</p>';
  }

  const plan = buildFinancingDecisionPlan(financing, project.budgetMax || project.budgetMin);
  const milestones = financing.milestones ?? [];
  const paid = milestones.filter(item => item.status === 'paid').reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const due = milestones.filter(item => item.status === 'due').reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const blocked = milestones.filter(item => item.status === 'blocked').length;

  return `
    <div class="decision ${plan.tone}">
      <div>
        <div class="label">${escapeHtml(plan.label)}</div>
        <h3>${escapeHtml(plan.title)}</h3>
        <p>${escapeHtml(plan.advisory)}</p>
      </div>
      <strong>${percent(financing.affordabilityScore)}</strong>
    </div>
    <div class="grid six">
      ${cells(plan.metrics)}
    </div>
    <div class="split">
      <div class="box">
        <div class="label">Actions financières</div>
        ${list(plan.actions.map(action => `${action.label} - ${action.detail}`))}
      </div>
      <div class="box">
        <div class="label">Vigilances</div>
        ${list(plan.warnings.length ? plan.warnings : ['Aucun blocage majeur détecté avec les données disponibles.'])}
      </div>
    </div>
    <div class="grid four">
      ${cells([
        { label: 'Statut', value: financingReadinessLabel(financing.readiness) },
        { label: 'Budget retenu', value: money(financing.estimatedBudget) },
        { label: 'Fonds déclarés', value: money((financing.ownContribution ?? 0) + (financing.requestedLoanAmount ?? 0)) },
        { label: 'Couverture budget', value: percent(financing.declaredFundingCoveragePercent) },
        { label: 'Marge travaux', value: money(financing.contingencyReserve) },
        { label: 'Apport', value: money(financing.ownContribution) },
        { label: 'Montant à compléter', value: money(financing.requestedLoanAmount) },
        { label: 'Niveau banque', value: projectBriefLabel(financing.bankAgreementStage || '') || 'À compléter' },
      ])}
    </div>
    <div class="split">
      <div class="box">
        <div class="label">Pièces déclarées</div>
        <div class="pills">${pills((financing.documentReadiness ?? []).map(item => projectBriefLabel(item) || item))}</div>
      </div>
      <div class="box">
        <div class="label">Jalons financiers</div>
        <div class="mini-grid">
          ${cells([
            { label: 'Échéances', value: String(milestones.length) },
            { label: 'Payé', value: money(paid) },
            { label: 'À régler', value: money(due) },
            { label: 'Blocages', value: String(blocked) },
          ])}
        </div>
      </div>
    </div>
    <div class="timeline">
      ${milestones.map((milestone, index) => `
        <div class="step">
          <strong>${index + 1}. ${escapeHtml(milestone.label)}</strong>
          <span>${escapeHtml(milestoneStatusLabel(milestone.status))} · ${milestone.percent}% · ${escapeHtml(money(milestone.expectedAmount))}</span>
          <p>${escapeHtml(milestone.trigger)}</p>
          ${milestone.note ? `<p class="note">${escapeHtml(milestone.note)}</p>` : ''}
        </div>
      `).join('') || '<p class="muted">Aucun jalon défini.</p>'}
    </div>
  `;
}

function renderDocuments(project: ProjectData) {
  const documents = project.documents ?? [];
  if (documents.length === 0) return '<p class="muted">Aucun document rattaché.</p>';
  return `<div class="timeline">${documents.map(document => `
    <div class="step">
      <strong>${escapeHtml(document.name)}</strong>
      <span>${escapeHtml(projectBriefLabel(document.type) || document.type)} · ${escapeHtml(document.date)}</span>
      ${document.url ? `<p>${escapeHtml(document.url)}</p>` : ''}
    </div>
  `).join('')}</div>`;
}

function renderQuotes(project: ProjectData) {
  const quotes = project.quotes ?? [];
  if (quotes.length === 0) return '<p class="muted">Aucun devis transmis.</p>';
  return `<div class="timeline">${quotes.map(quote => `
    <div class="step">
      <strong>${escapeHtml(quote.label)} - ${escapeHtml(money(quote.amount))}</strong>
      <span>${escapeHtml(quoteStatusLabel(quote.status))} · ${escapeHtml(quote.date)}</span>
      ${quote.description ? `<p>${escapeHtml(quote.description)}</p>` : ''}
      ${quote.scope?.length ? list(quote.scope) : ''}
    </div>
  `).join('')}</div>`;
}

function renderSchedule(project: ProjectData) {
  const scheduleItems = sortProjectSchedule(project.scheduleItems ?? []);
  if (scheduleItems.length === 0) return '<p class="muted">Aucun rendez-vous ou jalon planning publié.</p>';
  return `<div class="timeline">${scheduleItems.map(item => `
    <div class="step">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(formatProjectScheduleDate(item.scheduledAt, item.timeZone))} · ${escapeHtml(projectScheduleTypeLabel(item.type))} · ${escapeHtml(projectScheduleModeLabel(item.mode))}</span>
      <p>${escapeHtml(projectScheduleStatusLabel(item.status))}${item.decisionExpected ? ` - ${escapeHtml(item.decisionExpected)}` : ''}</p>
      ${item.preparation ? `<p class="note">${escapeHtml(item.preparation)}</p>` : ''}
    </div>
  `).join('')}</div>`;
}

function renderSiteUpdates(project: ProjectData, origin: string) {
  const updates = project.siteUpdates ?? [];
  if (updates.length === 0) return '<p class="muted">Aucun suivi chantier publié.</p>';
  return `<div class="gallery">${updates.map(update => `
    <div class="photo">
      <img src="${escapeHtml(absoluteUrl(update.imageUrl, origin))}" alt="${escapeHtml(update.caption)}" />
      <div>
        <strong>${escapeHtml(update.phase)} · ${update.progress}%</strong>
        <p>${escapeHtml(update.caption)}</p>
        ${update.report ? `<p class="note">${escapeHtml(update.report)}</p>` : ''}
        <span>${escapeHtml(formatDate(update.createdAt))} · ${escapeHtml(update.createdBy || 'Équipe Buildify')}</span>
      </div>
    </div>
  `).join('')}</div>`;
}

function renderMessages(project: ProjectData) {
  const messages = project.projectMessages ?? [];
  const infoResponses = project.missingInfoResponses ?? [];
  if (messages.length === 0 && infoResponses.length === 0 && !project.missingInfo) {
    return '<p class="muted">Aucun échange direct enregistré.</p>';
  }

  return `<div class="timeline">
    ${project.missingInfo ? `
      <div class="step">
        <strong>Information demandée</strong>
        <span>${escapeHtml(formatDate(project.missingInfoRequestedAt))}</span>
        <p>${escapeHtml(project.missingInfo)}</p>
      </div>
    ` : ''}
    ${infoResponses.map(response => `
      <div class="step">
        <strong>Réponse client</strong>
        <span>${escapeHtml(formatDate(response.respondedAt))} · ${escapeHtml(response.respondedBy || 'Client')}</span>
        <p>${escapeHtml(response.message)}</p>
      </div>
    `).join('')}
    ${messages.map(message => `
      <div class="step">
        <strong>${escapeHtml(message.senderName)}</strong>
        <span>${escapeHtml(message.senderRole === 'admin' ? 'Équipe Buildify' : 'Client')} · ${escapeHtml(formatDate(message.createdAt))}</span>
        <p>${escapeHtml(message.message)}</p>
      </div>
    `).join('')}
  </div>`;
}

export function buildProjectDossierHtml(project: ProjectData, mode: ProjectDossierMode, origin = '') {
  const brief = buildProjectBrief(project);
  const generatedAt = new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
  const title = project.title || project.modelName || project.categoryName || 'Projet BTP';
  const dossierLabel = mode === 'admin' ? 'Dossier de pilotage administrateur' : 'Dossier projet client';
  const coordination = [
    { label: 'Client', value: project.clientName || 'Client Buildify' },
    { label: 'Contact', value: [project.clientEmail, project.clientPhone].filter(Boolean).join(' / ') || 'À compléter' },
    { label: 'Présence', value: getField(project, 'clientPresence') ? projectBriefLabel(getField(project, 'clientPresence')) || getField(project, 'clientPresence') : 'À organiser' },
    { label: 'Pays résidence', value: getField(project, 'clientResidenceCountry') || 'À compléter' },
    { label: 'Fuseau', value: getField(project, 'clientTimeZone') || 'À compléter' },
    { label: 'Canal', value: getField(project, 'clientPreferredContactChannel') || 'À compléter' },
    { label: 'Mandataire', value: getField(project, 'representativeName') || 'Non renseigné' },
    { label: 'Téléphone relais', value: getField(project, 'representativePhone') || 'Non renseigné' },
  ];

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(dossierLabel)} - ${escapeHtml(project.referenceNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f6f6f6; color: #111; font-family: Arial, sans-serif; }
    main { max-width: 1120px; margin: 0 auto; padding: 34px; background: #fff; }
    header { display: flex; justify-content: space-between; gap: 28px; border-bottom: 2px solid #111; padding-bottom: 20px; }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: 0; }
    .meta { text-align: right; color: #555; font-size: 12px; line-height: 1.7; }
    h1 { margin: 28px 0 8px; font-size: 34px; line-height: 1.1; }
    h2 { margin: 28px 0 12px; font-size: 20px; }
    h3 { margin: 8px 0; font-size: 18px; line-height: 1.25; }
    p { color: #333; line-height: 1.6; margin: 6px 0; }
    ul { margin: 10px 0 0; padding-left: 20px; line-height: 1.7; color: #333; }
    .label { color: #666; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .value { margin-top: 7px; font-size: 14px; font-weight: 800; overflow-wrap: anywhere; }
    .help, .muted, .step span, .photo span { color: #666; font-size: 12px; line-height: 1.5; }
    .grid { display: grid; gap: 10px; margin-top: 14px; }
    .four { grid-template-columns: repeat(4, 1fr); }
    .six { grid-template-columns: repeat(3, 1fr); }
    .mini-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 12px; }
    .split { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
    .cell, .box, .step { border: 1px solid #ddd; border-radius: 10px; padding: 13px; break-inside: avoid; }
    .decision { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; border: 2px solid #111; border-radius: 12px; padding: 16px; }
    .decision strong { font-size: 34px; white-space: nowrap; }
    .risk { border-color: #111; border-left-width: 4px; }
    .structure { border-style: dashed; }
    .missing { border-style: dashed; background: #fafafa; }
    .timeline { display: grid; gap: 10px; margin-top: 12px; }
    .note { background: #f5f5f5; border-radius: 8px; padding: 8px; }
    .pill { display: inline-flex; border: 1px solid #ddd; border-radius: 999px; padding: 6px 9px; margin: 3px; font-size: 11px; font-weight: 700; }
    .visual { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
    .visual img, .photo img { width: 100%; border-radius: 12px; border: 1px solid #ddd; object-fit: cover; }
    .visual img { aspect-ratio: 16 / 10; }
    .gallery { display: grid; gap: 12px; margin-top: 12px; }
    .photo { display: grid; grid-template-columns: 180px 1fr; gap: 14px; border: 1px solid #ddd; border-radius: 12px; padding: 10px; }
    .photo img { height: 120px; }
    footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 14px; color: #666; font-size: 12px; }
    @media (max-width: 760px) {
      main { padding: 20px; }
      header, .split, .visual, .photo { display: block; }
      .meta { margin-top: 14px; text-align: left; }
      .four, .six, .mini-grid { grid-template-columns: 1fr; }
      .photo img { height: auto; margin-bottom: 10px; }
    }
    @media print {
      body { background: #fff; }
      main { padding: 22px; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <div class="brand">Buildify</div>
        <div>${escapeHtml(dossierLabel)}</div>
      </div>
      <div class="meta">
        <div>${escapeHtml(project.referenceNumber)}</div>
        <div>${escapeHtml(statusLabel(project.status))}</div>
        <div>Généré le ${escapeHtml(generatedAt)}</div>
      </div>
    </header>

    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(project.description || `${project.categoryName || 'Projet BTP'} situé à ${formatProjectLocation(project, 'localisation à préciser')}.`)}</p>

    <section class="grid four">
      ${cells([
        { label: 'Localisation', value: formatProjectLocation(project, 'À préciser') },
        { label: 'Budget', value: project.budgetMin && project.budgetMax ? `${FORMAT_XOF(project.budgetMin)} - ${FORMAT_XOF(project.budgetMax)}` : money(project.budgetMax || project.budgetMin) },
        { label: 'Ouvrage', value: project.categoryName || 'Projet BTP' },
        { label: 'Avancement', value: percent(project.progress) },
      ])}
    </section>

    <h2>Brief technique</h2>
    <section class="grid four">
      ${cells(brief.items.map(item => ({ label: item.label, value: item.value, help: item.helper })))}
    </section>
    <div class="split">
      <div class="box"><div class="label">Périmètre</div>${list(brief.scope)}</div>
      <div class="box"><div class="label">Contraintes et contexte</div>${list(brief.context)}</div>
    </div>

    <h2>Coordination client</h2>
    <section class="grid four">${cells(coordination)}</section>

    <h2>Décision financière</h2>
    ${renderFinancing(project)}

    <h2>Proposition visuelle</h2>
    ${renderVisualProposal(project, origin)}

    <h2>Devis</h2>
    ${renderQuotes(project)}

    <h2>Planning</h2>
    ${renderSchedule(project)}

    <h2>Documents</h2>
    ${renderDocuments(project)}

    <h2>Suivi chantier</h2>
    ${renderSiteUpdates(project, origin)}

    <h2>Communication</h2>
    ${renderMessages(project)}

    <footer>
      Ce dossier synthétise les informations déclarées dans Buildify. Les montants, délais et garanties restent à confirmer par devis, contrat, banque, notaire et contrôles techniques.
    </footer>
  </main>
</body>
</html>`;
}

export function downloadProjectDossier(project: ProjectData, mode: ProjectDossierMode) {
  if (typeof window === 'undefined') return;
  const html = buildProjectDossierHtml(project, mode, window.location.origin);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = `${project.referenceNumber}-${mode === 'admin' ? 'dossier-pilotage-admin' : 'dossier-client'}-${slug(project.title || 'projet') || 'buildify'}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}
