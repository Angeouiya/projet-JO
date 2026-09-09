'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import {
  ArrowLeft, Home, Building2, Building, Landmark, Hammer,
  Route, Construction, Droplets, DraftingCompass, HardHat, Ruler,
  ClipboardCheck, Truck, ArrowRight, Phone, Mail, MapPinIcon,
  CheckCircle2, FileSignature, WalletCards, Images,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.08 } } };

interface Service {
  icon: React.ElementType;
  title: string;
  description: string;
  details: string[];
  image: string;
}

const SERVICES: Service[] = [
  {
    icon: ClipboardCheck,
    title: 'Analyse gratuite de projet',
    description: 'Vous décrivez votre idée, votre terrain et votre budget. Nous vous aidons à voir ce qui est possible.',
    details: ['Projet clarifié', 'Terrain compris', 'Budget indicatif', 'Premières priorités'],
    image: '/images/chantier-1.png',
  },
  {
    icon: WalletCards,
    title: 'Budget & financement',
    description: 'Lecture simple de l’enveloppe à prévoir, de l’apport disponible, du reste à financer et des garanties utiles.',
    details: ['Budget du projet', 'Apport', 'Banque', 'Paiement par étapes'],
    image: '/images/bureau-1.png',
  },
  {
    icon: Images,
    title: 'Propositions visuelles',
    description: 'Images, variantes et présentation claire pour mieux se projeter avant de valider la suite.',
    details: ['Images couleur', 'Variantes', 'Synthèse client', 'Validation simple'],
    image: '/images/hero-villa.png',
  },
  {
    icon: Home,
    title: 'Construction de villas',
    description: 'Villas basses, maisons familiales, résidences de plain-pied ou à étage.',
    details: ['Villa basse', 'Maison contemporaine', 'Villa tropicale', 'Maison économique'],
    image: '/images/villa-1.png',
  },
  {
    icon: Building2,
    title: 'Construction de duplex',
    description: 'Duplex et bi-villas avec finitions haut de gamme pour familles et investisseurs.',
    details: ['Duplex standard', 'Duplex premium', 'Bi-villa mitoyenne', 'Duplex avec piscine'],
    image: '/images/duplex-1.png',
  },
  {
    icon: Building,
    title: 'Construction de triplex',
    description: 'Triplex d\'exception avec rooftop, domotique et finitions luxueuses.',
    details: ['Triplex standing', 'Triplex avec rooftop', 'Triplex domotique', 'Triplex familial'],
    image: '/images/triplex-1.png',
  },
  {
    icon: Landmark,
    title: 'Immeubles R+',
    description: 'Immeubles collectifs, résidences avec ascenseur, parking et commerces.',
    details: ['Immeuble R+', 'Résidence avec ascenseur', 'Immeuble mixte', 'Boutiques RDC'],
    image: '/images/immeuble-1.png',
  },
  {
    icon: Landmark,
    title: 'Promotion immobilière',
    description: 'Programmes immobiliers complets : conception, construction et remise des clés.',
    details: ['Lotissement viabilisé', 'Programme résidentiel', 'Copropriété', 'Vente sur plan'],
    image: '/images/cite-1.png',
  },
  {
    icon: Hammer,
    title: 'Rénovation',
    description: 'Réhabilitation, agrandissement et mise aux normes de bâtiments existants.',
    details: ['Rénovation complète', 'Agrandissement', 'Mise aux normes', 'Ravalement de façade'],
    image: '/images/interieur-1.png',
  },
  {
    icon: Route,
    title: 'Routes & chaussées',
    description: 'Construction et réhabilitation de routes en terre, en latérite et bitumées.',
    details: ['Route bitumée', 'Piste en latérite', 'Réhabilitation', 'Chaussée urbaine'],
    image: '/images/road-1.png',
  },
  {
    icon: Construction,
    title: 'VRD & assainissement',
    description: 'Voirie, réseaux d\'eau, d\'électricité et assainissement pour lotissements.',
    details: ['Voirie urbaine', 'Réseau d\'eau', 'Assainissement pluvial', 'Égouts'],
    image: '/images/chantier-1.png',
  },
  {
    icon: Droplets,
    title: 'Hydraulique & forage',
    description: 'Adduction d\'eau potable, forage, stations de pompage et réservoirs.',
    details: ['Forage', 'Adduction d\'eau', 'Station de pompage', 'Réservoir'],
    image: '/images/hydraulique-1.png',
  },
  {
    icon: DraftingCompass,
    title: 'Plans et étude de faisabilité',
    description: 'Plans, premières surfaces, estimation et conseils pour préparer le devis et les autorisations.',
    details: ['Plans', 'Surfaces', 'Estimation', 'Avis professionnel'],
    image: '/images/bureau-1.png',
  },
];

const PROCESS = [
  {
    icon: ClipboardCheck,
    title: 'Votre besoin',
    desc: 'Nous rassemblons vos attentes, votre terrain, votre budget et les documents déjà disponibles.',
  },
  {
    icon: Ruler,
    title: 'Plans et estimation',
    desc: 'Nous préparons une première lecture claire pour comprendre les choix possibles.',
  },
  {
    icon: FileSignature,
    title: 'Devis & contrat',
    desc: 'Vous recevez une proposition lisible avec prix, délais, étapes et conditions.',
  },
  {
    icon: Truck,
    title: 'Approvisionnement',
    desc: 'Les matériaux et intervenants sont préparés selon le niveau de finition attendu.',
  },
  {
    icon: HardHat,
    title: 'Exécution',
    desc: 'Le chantier avance avec photos, points de suivi et décisions visibles.',
  },
  {
    icon: CheckCircle2,
    title: 'Livraison & réception',
    desc: 'Vous contrôlez la livraison, les réserves éventuelles et la suite après réception.',
  },
];

export function ServicesView() {
  const goBack = useAppStore(s => s.goBack);
  const navigate = useAppStore(s => s.navigate);
  const gridRef = useRef(null);
  const processRef = useRef(null);
  const isGridInView = useInView(gridRef, { once: true, margin: '-40px' });
  const isProcessInView = useInView(processRef, { once: true, margin: '-40px' });

  return (
    <main className="min-h-screen bg-background pb-12">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="font-bold text-lg">Nos services</h1>
        </div>
      </div>

      {/* Intro */}
      <div className="px-4 md:px-8 lg:px-16 max-w-5xl mx-auto">
        <div className="mt-8 mb-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ce que nous faisons</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xl">
            Buildify accompagne les particuliers, investisseurs et entreprises pour construire, rénover, aménager un terrain ou suivre un projet à distance.
          </p>
        </div>

        {/* Services grid */}
        <motion.div
          ref={gridRef}
          initial="hidden"
          animate={isGridInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="space-y-4"
        >
          {SERVICES.map(service => (
            <motion.div key={service.title} variants={fadeUp}>
              <Card className="py-0 gap-0 overflow-hidden border-border/50 hover:border-foreground/20 transition-colors">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="h-40 w-full flex-shrink-0 md:h-auto md:w-56 lg:w-64">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-5 md:p-6">
                      <div className="flex items-start gap-4">
                        <div className="size-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <service.icon className="size-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{service.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {service.details.map(d => (
                              <span
                                key={d}
                                className="px-2.5 py-1 bg-muted rounded-md text-[11px] text-muted-foreground"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <Separator className="my-12" />

        {/* Process */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Notre processus</h2>
          <p className="mt-2 text-sm text-muted-foreground">Une méthode simple, de l’idée à la livraison.</p>
        </div>
        <motion.div
          ref={processRef}
          initial="hidden"
          animate={isProcessInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="mt-8 space-y-0"
        >
          {PROCESS.map((step, i) => (
            <motion.div key={step.title} variants={fadeUp} className="flex gap-4 md:gap-6">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="size-10 rounded-full border-2 border-foreground flex items-center justify-center bg-background z-10">
                  <step.icon className="size-4" />
                </div>
                {i < PROCESS.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>
              {/* Content */}
              <div className="pb-8 pt-1">
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-md">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <Separator className="my-12" />

        {/* CTA */}
        <div className="bg-foreground text-primary-foreground rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-xl md:text-2xl font-bold">Vous avez un projet ?</h2>
          <p className="mt-2 text-primary-foreground/60 text-sm max-w-md mx-auto">
            Parlez-nous de votre projet. Nous vous revenons sous 48h avec une première analyse claire.
          </p>
          <Button
            size="lg"
            className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-sm font-semibold"
            onClick={() => navigate('create')}
          >
            Démarrer mon projet
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>

        {/* Contact info */}
        <div className="mt-12 flex flex-col md:flex-row justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Phone className="size-4" /> +225 07 00 00 00 00</div>
          <div className="flex items-center gap-2"><Mail className="size-4" /> contact@buildify.ci</div>
          <div className="flex items-center gap-2"><MapPinIcon className="size-4" /> Abidjan, Côte d’Ivoire</div>
        </div>
      </div>
    </main>
  );
}
