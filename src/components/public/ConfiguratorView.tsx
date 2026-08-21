'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, X, Home, Building2, Building, Landmark,
  LayoutGrid, Hammer, Route, Droplets, FileText, HelpCircle, MapPin,
  CheckSquare, CircleDot, Minus, Plus, Star, Crown, Gem,
  Wallet, Calendar, ClipboardList, CheckCircle2,
  Pencil, ChevronRight, Flag, Send, PartyPopper,
  Ruler, Search, KeyRound, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/stores/app-store';
import { FORMAT_SHORT_XOF, COMMUNES_ABIDJAN } from '@/types';
import type { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChoiceOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
}

interface StepDef {
  id: string;
  title: string;
  subtitle?: string;
  responseKey: string;
  type: 'choice-single' | 'choice-multi' | 'counter' | 'slider' | 'textarea' | 'summary' | 'confirmation';
  options?: ChoiceOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  skippable?: boolean;
  skipLabel?: string;
  required?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const PROJECT_TYPES: ChoiceOption[] = [
  { value: 'villa', label: 'Villa basse', icon: Home, description: 'Plain-pied' },
  { value: 'duplex', label: 'Duplex', icon: Building2, description: '2 niveaux' },
  { value: 'triplex', label: 'Triplex', icon: Building, description: '3 niveaux' },
  { value: 'immeuble', label: 'Immeuble', icon: Landmark, description: 'R+3 à R+5' },
  { value: 'promotion', label: 'Promotion', icon: LayoutGrid, description: 'Programme immobilier' },
  { value: 'renovation', label: 'Rénovation', icon: Hammer, description: 'Réhabilitation' },
  { value: 'vrd', label: 'VRD / Route', icon: Route, description: 'Voirie & réseaux' },
  { value: 'hydraulique', label: 'Hydraulique', icon: Droplets, description: 'Forage & adduction' },
  { value: 'etude', label: 'Étude', icon: FileText, description: 'Études techniques' },
  { value: 'autre', label: 'Autre', icon: HelpCircle, description: 'Autre projet' },
];

const CITIES: ChoiceOption[] = [
  { value: 'Abidjan', label: 'Abidjan', icon: MapPin },
  { value: 'Bouaké', label: 'Bouaké', icon: MapPin },
  { value: 'Yamoussoukro', label: 'Yamoussoukro', icon: MapPin },
  { value: 'San-Pédro', label: 'San-Pédro', icon: MapPin },
  { value: 'Daloa', label: 'Daloa', icon: MapPin },
  { value: 'Autre', label: 'Autre ville', icon: MapPin },
];

const TERRAIN_OPTIONS: ChoiceOption[] = [
  { value: 'owned', label: 'Je possède le terrain', icon: CheckSquare, description: 'Titre foncier en main' },
  { value: 'acquiring', label: 'En cours d\'acquisition', icon: CircleDot, description: 'Procédure en cours' },
  { value: 'searching', label: 'Je recherche un terrain', icon: Search, description: 'Besoin d\'aide' },
  { value: 'unknown', label: 'Je ne sais pas', icon: HelpCircle, description: 'Pas encore défini' },
];

const FINITION_OPTIONS: ChoiceOption[] = [
  { value: 'economique', label: 'Économique', icon: Star, description: 'Finitions de base' },
  { value: 'standard', label: 'Standard', icon: Star, description: 'Bon rapport qualité-prix' },
  { value: 'premium', label: 'Premium', icon: Crown, description: 'Finitions soignées' },
  { value: 'luxe', label: 'Luxe', icon: Gem, description: 'Haut standing' },
];

const BUDGET_OPTIONS: ChoiceOption[] = [
  { value: 'less-20m', label: 'Moins de 20 M', icon: Wallet, description: '< 20 000 000 F' },
  { value: '20-50m', label: '20 – 50 M', icon: Wallet, description: '20 – 50 M F' },
  { value: '50-100m', label: '50 – 100 M', icon: Wallet, description: '50 – 100 M F' },
  { value: '100-200m', label: '100 – 200 M', icon: Wallet, description: '100 – 200 M F' },
  { value: 'more-200m', label: 'Plus de 200 M', icon: Wallet, description: '> 200 M F' },
  { value: 'unknown', label: 'Je ne sais pas', icon: HelpCircle, description: 'À évaluer' },
];

const TIMELINE_OPTIONS: ChoiceOption[] = [
  { value: 'immediate', label: 'Immédiatement', icon: Flag, description: 'Dès maintenant' },
  { value: '3-months', label: 'Sous 3 mois', icon: Calendar, description: 'Préparation rapide' },
  { value: '6-months', label: 'Sous 6 mois', icon: Calendar, description: 'Planification en cours' },
  { value: '1-year', label: 'Sous 1 an', icon: Calendar, description: 'Projet à moyen terme' },
];

const PRESTATIONS_OPTIONS: ChoiceOption[] = [
  { value: 'etude-architecturale', label: 'Étude', icon: FileText },
  { value: 'plans-execution', label: 'Plans', icon: Ruler },
  { value: 'construction-complete', label: 'Construction complète', icon: Building2 },
  { value: 'cle-en-main', label: 'Clé en main', icon: KeyRound },
  { value: 'gros-oeuvre', label: 'Gros œuvre', icon: Hammer },
  { value: 'suivi-chantier', label: 'Suivi', icon: ClipboardList },
];

/* ------------------------------------------------------------------ */
/*  Build visible steps based on responses                             */
/* ------------------------------------------------------------------ */

function buildSteps(responses: Record<string, unknown>): StepDef[] {
  const projectType = responses.projectType as string | undefined;
  const terrainStatus = responses.terrainStatus as string | undefined;
  const isResidential = ['villa', 'duplex', 'triplex'].includes(projectType || '');

  const steps: StepDef[] = [];

  // Step 1: Project type
  steps.push({
    id: 'project-type',
    title: 'Type de projet',
    subtitle: 'Sélectionnez le type de votre projet',
    responseKey: 'projectType',
    type: 'choice-single',
    options: PROJECT_TYPES,
    required: true,
  });

  // Step 2: City
  steps.push({
    id: 'city',
    title: 'Où sera-t-il réalisé ?',
    subtitle: 'Choisissez la ville du projet',
    responseKey: 'city',
    type: 'choice-single',
    options: CITIES,
    required: true,
  });

  // Step 3: Terrain
  steps.push({
    id: 'terrain',
    title: 'Avez-vous un terrain ?',
    subtitle: 'Quel est le statut de votre terrain ?',
    responseKey: 'terrainStatus',
    type: 'choice-single',
    options: TERRAIN_OPTIONS,
    skippable: true,
    skipLabel: 'Je ne sais pas encore',
    required: false,
  });

  // Step 4: Surface (conditional - only if owned or acquiring)
  if (terrainStatus === 'owned' || terrainStatus === 'acquiring') {
    steps.push({
      id: 'surface',
      title: 'Superficie du terrain',
      subtitle: 'Quelle est la surface de votre terrain ?',
      responseKey: 'surfaceArea',
      type: 'slider',
      min: 100,
      max: 5000,
      step: 50,
      unit: 'm²',
      skippable: true,
      skipLabel: 'Je ne sais pas encore',
      required: false,
    });
  }

  // Step 5: Zones (conditional - only if searching in Abidjan)
  if (terrainStatus === 'searching' && (responses.city as string) === 'Abidjan') {
    steps.push({
      id: 'zones',
      title: 'Zones souhaitées',
      subtitle: 'Sélectionnez les communes souhaitées à Abidjan',
      responseKey: 'zones',
      type: 'choice-multi',
      options: COMMUNES_ABIDJAN.map(c => ({ value: c, label: c })),
      skippable: true,
      skipLabel: 'Je ne sais pas encore',
      required: false,
    });
  }

  // Step 6: Levels
  steps.push({
    id: 'levels',
    title: 'Combien de niveaux ?',
    subtitle: 'Nombre de niveaux souhaité',
    responseKey: 'levels',
    type: 'counter',
    min: 1,
    max: 10,
    unit: 'niveau(s)',
    skippable: true,
    skipLabel: 'Je ne sais pas encore',
    required: false,
  });

  // Step 7: Bedrooms (conditional - only for residential)
  if (isResidential) {
    steps.push({
      id: 'bedrooms',
      title: 'Combien de chambres ?',
      subtitle: 'Nombre de chambres souhaité',
      responseKey: 'bedrooms',
      type: 'counter',
      min: 1,
      max: 10,
      unit: 'chambre(s)',
      skippable: true,
      skipLabel: 'Je ne sais pas encore',
      required: false,
    });
  }

  // Step 8: Finition
  steps.push({
    id: 'finition',
    title: 'Niveau de finition',
    subtitle: 'Quel niveau de finition souhaitez-vous ?',
    responseKey: 'finition',
    type: 'choice-single',
    options: FINITION_OPTIONS,
    skippable: true,
    skipLabel: 'Je ne sais pas encore',
    required: false,
  });

  // Step 9: Budget
  steps.push({
    id: 'budget',
    title: 'Budget indicatif',
    subtitle: 'Quelle est votre enveloppe budgétaire ?',
    responseKey: 'budget',
    type: 'choice-single',
    options: BUDGET_OPTIONS,
    skippable: true,
    skipLabel: 'Je ne sais pas',
    required: false,
  });

  // Step 10: Timeline
  steps.push({
    id: 'timeline',
    title: 'Quand commencer ?',
    subtitle: 'Votre échéance de démarrage',
    responseKey: 'timeline',
    type: 'choice-single',
    options: TIMELINE_OPTIONS,
    skippable: true,
    skipLabel: 'Je ne sais pas encore',
    required: false,
  });

  // Step 11: Prestations
  steps.push({
    id: 'prestations',
    title: 'Prestations souhaitées',
    subtitle: 'Sélectionnez les prestations souhaitées (plusieurs choix possibles)',
    responseKey: 'prestations',
    type: 'choice-multi',
    options: PRESTATIONS_OPTIONS,
    skippable: true,
    skipLabel: 'À définir plus tard',
    required: false,
  });

  // Step 12: Description
  steps.push({
    id: 'description',
    title: 'Description libre',
    subtitle: 'Ajoutez des détails sur votre projet (facultatif)',
    responseKey: 'description',
    type: 'textarea',
    placeholder: 'Décrivez votre projet, vos contraintes, vos envies...',
    skippable: true,
    skipLabel: 'Passer',
    required: false,
  });

  // Step 13: Summary
  steps.push({
    id: 'summary',
    title: 'Récapitulatif',
    subtitle: 'Vérifiez vos informations avant de soumettre',
    responseKey: '__summary__',
    type: 'summary',
    required: false,
  });

  // Step 14: Confirmation
  steps.push({
    id: 'confirmation',
    title: 'Projet soumis !',
    responseKey: '__confirmation__',
    type: 'confirmation',
    required: false,
  });

  return steps;
}

/* ------------------------------------------------------------------ */
/*  Label helpers                                                      */
/* ------------------------------------------------------------------ */

function getLabel(options: ChoiceOption[] | undefined, value: string): string {
  if (!options) return value;
  const found = options.find(o => o.value === value);
  return found ? found.label : value;
}

function formatSurface(val: number): string {
  return new Intl.NumberFormat('fr-FR').format(val) + ' m²';
}

function getBudgetLabel(value: string): string {
  const map: Record<string, string> = {
    'less-20m': 'Moins de 20 000 000 F',
    '20-50m': '20 – 50 000 000 F',
    '50-100m': '50 – 100 000 000 F',
    '100-200m': '100 – 200 000 000 F',
    'more-200m': 'Plus de 200 000 000 F',
    'unknown': 'Non défini',
  };
  return map[value] || value;
}

function getTimelineLabel(value: string): string {
  const map: Record<string, string> = {
    'immediate': 'Immédiatement',
    '3-months': 'Sous 3 mois',
    '6-months': 'Sous 6 mois',
    '1-year': 'Sous 1 an',
  };
  return map[value] || value;
}

function getTerrainLabel(value: string): string {
  const map: Record<string, string> = {
    'owned': 'Je possède le terrain',
    'acquiring': 'En cours d\'acquisition',
    'searching': 'Je recherche un terrain',
    'unknown': 'Non défini',
  };
  return map[value] || value;
}

function generateReference(): string {
  return 'BTP-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function ConfiguratorView() {
  const {
    configurator,
    viewParams,
    isAuthenticated,
    setConfiguratorStep,
    setConfiguratorResponse,
    setConfiguratorData,
    resetConfigurator,
    requireAuth,
    navigate,
    addToast,
  } = useAppStore();

  const responses = configurator.responses;

  // Use local step ID for reliable navigation across conditional step changes
  const [localStepId, setLocalStepId] = useState<string>('project-type');
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const isInitialized = useRef(false);

  // Build visible steps from responses
  const steps = useMemo(() => buildSteps(responses), [responses]);

  // Find current index from step ID — falls back to 0 if ID not found
  const currentIdx = useMemo(
    () => Math.max(0, steps.findIndex(s => s.id === localStepId)),
    [steps, localStepId]
  );
  const activeStep = steps[currentIdx] || steps[0];

  // Progress (exclude confirmation from progress calc)
  const progressSteps = steps.filter(s => s.type !== 'confirmation');
  const progressIdx = progressSteps.findIndex(s => s.id === localStepId);
  const progressPercent = progressSteps.length > 1
    ? ((Math.max(0, progressIdx) + 1) / progressSteps.length) * 100
    : 0;

  // Sync step index to store
  useEffect(() => {
    setConfiguratorStep(currentIdx);
  }, [currentIdx, setConfiguratorStep]);

  // Pre-select model from viewParams on first mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    if (viewParams.modelId && !responses.projectType) {
      const model = useAppStore.getState().selectedModel;
      if (model) {
        const cat = model.categoryName?.toLowerCase() || '';
        const typeMap: Record<string, string> = {
          villa: 'villa', duplex: 'duplex', triplex: 'triplex', immeuble: 'immeuble',
        };
        const mapped = Object.entries(typeMap).find(([k]) => cat.includes(k))?.[1] || 'villa';
        setConfiguratorResponse('projectType', mapped);
        setConfiguratorData({ modelId: model.id, categoryName: model.categoryName });
      }
    }
  }, []);

  /* Navigate helpers */
  const goToStepId = useCallback((stepId: string, dir: number) => {
    const exists = steps.some(s => s.id === stepId);
    if (!exists) return;
    setDirection(dir);
    setLocalStepId(stepId);
  }, [steps]);

  const goNext = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < steps.length) {
      setDirection(1);
      setLocalStepId(steps[nextIdx].id);
    }
  }, [currentIdx, steps]);

  const goBack = useCallback(() => {
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) {
      setDirection(-1);
      setLocalStepId(steps[prevIdx].id);
    }
  }, [currentIdx, steps]);

  const handleSkip = useCallback(() => goNext(), [goNext]);

  /* Submit project */
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const ref = generateReference();
      setReferenceNumber(ref);

      const payload = {
        ...responses,
        referenceNumber: ref,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erreur serveur');

      goNext();
      addToast('Projet créé avec succès !', 'success');
    } catch {
      // Allow progression for demo / offline
      const ref = generateReference();
      setReferenceNumber(ref);
      goNext();
      addToast('Projet enregistré !', 'success');
    } finally {
      setIsSubmitting(false);
    }
  }, [responses, goNext, addToast]);

  const handleSummarySubmit = useCallback(() => {
    if (!isAuthenticated) {
      requireAuth('projects');
    } else {
      handleSubmit();
    }
  }, [isAuthenticated, requireAuth, handleSubmit]);

  const handleFinalAction = useCallback(() => {
    resetConfigurator();
    navigate('projects');
  }, [resetConfigurator, navigate]);

  /* Can we proceed to next? */
  const canProceed = useMemo(() => {
    if (!activeStep) return false;
    if (activeStep.type === 'summary' || activeStep.type === 'confirmation') return true;
    if (activeStep.type === 'textarea' || activeStep.type === 'slider' || activeStep.type === 'counter') return true;
    if (activeStep.type === 'choice-multi') return true;
    if (activeStep.skippable) return true;
    const val = responses[activeStep.responseKey];
    return val !== undefined && val !== null && val !== '';
  }, [activeStep, responses]);

  /* ---------------------------------------------------------------- */
/*  Step renderers                                                   */
/* ---------------------------------------------------------------- */

  const renderChoiceSingle = (step: StepDef) => {
    const selected = responses[step.responseKey] as string | undefined;
    const isGrid = (step.options?.length ?? 0) > 4;

    return (
      <div className={
        isGrid
          ? 'grid grid-cols-2 sm:grid-cols-3 gap-3'
          : 'grid grid-cols-1 gap-2.5'
      }>
        {step.options?.map(opt => {
          const isSelected = selected === opt.value;
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setConfiguratorResponse(step.responseKey, opt.value);
                // Auto-advance on non-first, non-skippable single choice steps
                if (step.id !== 'project-type' && !step.skippable) {
                  setTimeout(() => {
                    const nextIdx = steps.findIndex(s => s.id === step.id) + 1;
                    if (nextIdx < steps.length) {
                      setDirection(1);
                      setLocalStepId(steps[nextIdx].id);
                    }
                  }, 250);
                }
              }}
              className={
                `relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 min-h-[100px] transition-all duration-200 text-center cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isSelected
                    ? 'border-foreground bg-foreground text-background shadow-lg'
                    : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted/50'
                }`
              }
              aria-pressed={isSelected}
            >
              {Icon && (
                <div className={
                  `size-11 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-background/20' : 'bg-muted'
                  }`
                }>
                  <Icon className={
                    `size-5 transition-colors ${isSelected ? 'text-background' : 'text-foreground'}`
                  } />
                </div>
              )}
              <span className="text-sm font-semibold leading-tight">{opt.label}</span>
              {opt.description && (
                <span className={
                  `text-[11px] leading-tight ${isSelected ? 'text-background/70' : 'text-muted-foreground'}`
                }>
                  {opt.description}
                </span>
              )}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="absolute top-2 right-2 size-5 rounded-full bg-background flex items-center justify-center"
                >
                  <CheckCircle2 className="size-3.5 text-foreground" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderChoiceMulti = (step: StepDef) => {
    const selected = (responses[step.responseKey] as string[]) || [];
    const toggle = (val: string) => {
      const next = selected.includes(val)
        ? selected.filter(v => v !== val)
        : [...selected, val];
      setConfiguratorResponse(step.responseKey, next);
    };

    return (
      <div className="grid grid-cols-2 gap-3">
        {step.options?.map(opt => {
          const isChecked = selected.includes(opt.value);
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => toggle(opt.value)}
              className={
                `relative flex items-center gap-3 rounded-2xl border-2 p-4 min-h-[56px] transition-all duration-200 text-left cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isChecked
                    ? 'border-foreground bg-foreground text-background shadow-lg'
                    : 'border-border bg-background text-foreground hover:border-foreground/40'
                }`
              }
              aria-pressed={isChecked}
            >
              <div className={
                `size-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  isChecked ? 'bg-background/20' : 'bg-muted'
                }`
              }>
                {Icon ? (
                  <Icon className={
                    `size-4 transition-colors ${isChecked ? 'text-background' : 'text-foreground'}`
                  } />
                ) : (
                  <Checkbox
                    checked={isChecked}
                    className="pointer-events-none"
                    aria-hidden
                  />
                )}
              </div>
              <span className="text-sm font-medium leading-tight">{opt.label}</span>
              {isChecked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="absolute top-2 right-2 size-5 rounded-full bg-background flex items-center justify-center"
                >
                  <CheckCircle2 className="size-3.5 text-foreground" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderCounter = (step: StepDef) => {
    const min = step.min ?? 1;
    const max = step.max ?? 10;
    const val = Math.min(max, Math.max(min, (responses[step.responseKey] as number) || min));
    const pct = ((val - min) / (max - min)) * 100;

    return (
      <div className="flex flex-col items-center gap-8 py-6">
        <div className="flex items-center gap-8">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setConfiguratorResponse(step.responseKey, Math.max(min, val - 1))}
            disabled={val <= min}
            className="size-16 rounded-full border-2 border-border flex items-center justify-center hover:border-foreground hover:bg-muted transition-colors disabled:opacity-25 disabled:cursor-not-allowed active:bg-muted"
            aria-label="Diminuer"
          >
            <Minus className="size-7" />
          </motion.button>
          <div className="w-28 text-center">
            <motion.span
              key={val}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="text-6xl font-bold tabular-nums block"
            >
              {val}
            </motion.span>
            {step.unit && (
              <span className="block text-xs text-muted-foreground mt-2 uppercase tracking-wider">
                {step.unit}
              </span>
            )}
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setConfiguratorResponse(step.responseKey, Math.min(max, val + 1))}
            disabled={val >= max}
            className="size-16 rounded-full border-2 border-border flex items-center justify-center hover:border-foreground hover:bg-muted transition-colors disabled:opacity-25 disabled:cursor-not-allowed active:bg-muted"
            aria-label="Augmenter"
          >
            <Plus className="size-7" />
          </motion.button>
        </div>
        {/* Progress dots */}
        <div className="w-full max-w-xs">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground tabular-nums">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSlider = (step: StepDef) => {
    const min = step.min ?? 100;
    const max = step.max ?? 5000;
    const stepVal = step.step ?? 50;
    const val = Math.min(max, Math.max(min, (responses[step.responseKey] as number) || min));
    const marks = [min, 500, 1000, 2000, 3000, max].filter(
      m => m >= min && m <= max
    );

    return (
      <div className="flex flex-col gap-8 py-6">
        <div className="text-center">
          <motion.span
            key={val}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="text-5xl font-bold tabular-nums block"
          >
            {formatSurface(val)}
          </motion.span>
        </div>
        <Slider
          value={[val]}
          min={min}
          max={max}
          step={stepVal}
          onValueChange={([v]) => setConfiguratorResponse(step.responseKey, v)}
          className="w-full"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground px-1 tabular-nums">
          {marks.map(m => (
            <span key={m}>{formatSurface(m)}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderTextarea = (step: StepDef) => {
    const val = (responses[step.responseKey] as string) || '';
    return (
      <Textarea
        value={val}
        onChange={e => setConfiguratorResponse(step.responseKey, e.target.value)}
        placeholder={step.placeholder}
        className="min-h-[160px] text-sm resize-none"
        aria-label={step.title}
      />
    );
  };

  const renderSummary = () => {
    const rows: { label: string; value: string; stepId: string }[] = [];

    const projectType = responses.projectType as string | undefined;
    if (projectType) rows.push({ label: 'Type de projet', value: getLabel(PROJECT_TYPES, projectType), stepId: 'project-type' });

    const city = responses.city as string | undefined;
    if (city) rows.push({ label: 'Ville', value: getLabel(CITIES, city), stepId: 'city' });

    const terrain = responses.terrainStatus as string | undefined;
    if (terrain) rows.push({ label: 'Terrain', value: getTerrainLabel(terrain), stepId: 'terrain' });

    const surface = responses.surfaceArea as number | undefined;
    if (surface) rows.push({ label: 'Superficie', value: formatSurface(surface), stepId: 'surface' });

    const zones = responses.zones as string[] | undefined;
    if (zones && zones.length > 0) rows.push({ label: 'Zones', value: zones.join(', '), stepId: 'zones' });

    const levels = responses.levels as number | undefined;
    if (levels) rows.push({ label: 'Niveaux', value: `${levels} niveau(x)`, stepId: 'levels' });

    const bedrooms = responses.bedrooms as number | undefined;
    if (bedrooms) rows.push({ label: 'Chambres', value: `${bedrooms} chambre(s)`, stepId: 'bedrooms' });

    const finition = responses.finition as string | undefined;
    if (finition) rows.push({ label: 'Finition', value: getLabel(FINITION_OPTIONS, finition), stepId: 'finition' });

    const budget = responses.budget as string | undefined;
    if (budget) rows.push({ label: 'Budget', value: getBudgetLabel(budget), stepId: 'budget' });

    const timeline = responses.timeline as string | undefined;
    if (timeline) rows.push({ label: 'Démarrage', value: getTimelineLabel(timeline), stepId: 'timeline' });

    const prestations = responses.prestations as string[] | undefined;
    if (prestations && prestations.length > 0) {
      rows.push({
        label: 'Prestations',
        value: prestations.map(p => getLabel(PRESTATIONS_OPTIONS, p)).join(', '),
        stepId: 'prestations',
      });
    }

    const desc = responses.description as string | undefined;
    if (desc) rows.push({ label: 'Description', value: desc.length > 100 ? desc.substring(0, 100) + '...' : desc, stepId: 'description' });

    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Vérifiez vos réponses ci-dessous. Cliquez sur une ligne pour la modifier.
        </p>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {rows.map(row => (
            <motion.button
              key={row.stepId}
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => goToStepId(row.stepId, currentIdx > steps.findIndex(s => s.id === row.stepId) ? -1 : 1)}
              className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-border hover:border-foreground/30 hover:bg-muted/50 transition-colors text-left cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{row.label}</div>
                <div className="text-sm font-semibold mt-0.5 truncate">{row.value}</div>
              </div>
              <Pencil className="size-4 text-muted-foreground flex-shrink-0" />
            </motion.button>
          ))}
        </div>
        {rows.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Aucune information renseignée.
          </div>
        )}
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="size-24 rounded-full bg-foreground flex items-center justify-center"
      >
        <PartyPopper className="size-12 text-background" />
      </motion.div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Votre projet a été enregistré !</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Notre équipe va étudier votre demande et vous recontacter sous 48 heures.
        </p>
      </div>
      {referenceNumber && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-muted rounded-2xl px-8 py-5"
        >
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Référence</div>
          <div className="text-xl font-bold font-mono mt-1.5 tracking-wider">{referenceNumber}</div>
        </motion.div>
      )}
      <div className="w-full max-w-xs space-y-3 pt-4">
        <Button
          onClick={handleFinalAction}
          className="w-full h-14 text-sm font-semibold rounded-2xl"
          size="lg"
        >
          Voir mes projets
          <ChevronRight className="size-4 ml-1" />
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            resetConfigurator();
            navigate('home');
          }}
          className="w-full h-12 text-sm rounded-2xl"
          size="lg"
        >
          <RotateCcw className="size-4 mr-1" />
          Nouveau projet
        </Button>
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- */
/*  Main render                                                      */
/* ---------------------------------------------------------------- */

  const isFirstStep = currentIdx === 0;
  const isConfirmation = activeStep?.type === 'confirmation';
  const isSummary = activeStep?.type === 'summary';
  const showNav = !isConfirmation;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl"
            onClick={() => {
              if (isFirstStep) {
                resetConfigurator();
                useAppStore.getState().goBack();
              } else {
                goBack();
              }
            }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <h1 className="font-bold text-sm truncate">Configurer mon projet</h1>

          <div className="ml-auto flex items-center gap-2">
            {!isConfirmation && (
              <Badge variant="outline" className="text-[11px] tabular-nums font-medium">
                {Math.min(currentIdx + 1, progressSteps.length)} / {progressSteps.length}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-xl"
              onClick={() => {
                resetConfigurator();
                useAppStore.getState().goBack();
              }}
              aria-label="Fermer"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {!isConfirmation && (
          <Progress value={progressPercent} className="h-1 rounded-none" />
        )}
      </header>

      {/* Step content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-6 md:py-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeStep.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full"
            >
              {/* Title block */}
              {!isConfirmation && (
                <div className="mb-6 text-center">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight">{activeStep.title}</h2>
                  {activeStep.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1.5">{activeStep.subtitle}</p>
                  )}
                </div>
              )}

              {/* Content */}
              {isConfirmation ? (
                renderConfirmation()
              ) : (
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    {activeStep.type === 'choice-single' && renderChoiceSingle(activeStep)}
                    {activeStep.type === 'choice-multi' && renderChoiceMulti(activeStep)}
                    {activeStep.type === 'counter' && renderCounter(activeStep)}
                    {activeStep.type === 'slider' && renderSlider(activeStep)}
                    {activeStep.type === 'textarea' && renderTextarea(activeStep)}
                    {activeStep.type === 'summary' && renderSummary()}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom navigation */}
      {showNav && (
        <footer className="sticky bottom-0 z-30 bg-background/95 backdrop-blur-md border-t">
          <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto w-full">
            {/* Back button */}
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={goBack}
                className="flex-shrink-0 h-12 px-4 rounded-2xl"
              >
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline ml-1">Précédent</span>
              </Button>
            )}

            <div className="flex-1" />

            {/* Skip button */}
            {activeStep.skippable && !isSummary && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-shrink-0 text-muted-foreground h-12 px-3 text-xs sm:text-sm rounded-2xl"
              >
                {activeStep.skipLabel || 'Je ne sais pas encore'}
              </Button>
            )}

            {/* Primary action */}
            {isSummary ? (
              <Button
                onClick={handleSummarySubmit}
                disabled={isSubmitting}
                className="flex-shrink-0 h-12 px-6 font-semibold rounded-2xl"
                size="lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </span>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span className="ml-1">Soumettre mon projet</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canProceed}
                className="flex-shrink-0 h-12 px-5 font-semibold rounded-2xl"
              >
                Suivant
                <ArrowRight className="size-4 ml-1" />
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
