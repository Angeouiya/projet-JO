'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import {
  Home, Building2, Building, Landmark, MapPin,
  Grid3X3, Hammer, Route, Construction, Droplets, FileText,
  ArrowRight, ChevronRight, Phone, Mail, MapPinIcon,
  Maximize2, BedDouble, Bath, Layers, Clock, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';
import { FORMAT_SHORT_XOF } from '@/types';
import type { CatalogModelData } from '@/types';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.1 } } };

const categories = [
  { name: 'Villa basse', icon: Home, image: '/images/villa-1.png' },
  { name: 'Duplex', icon: Building2, image: '/images/duplex-1.png' },
  { name: 'Triplex', icon: Building, image: '/images/triplex-1.png' },
  { name: 'Immeuble', icon: Landmark, image: '/images/immeuble-1.png' },
  { name: 'Promotion', icon: Landmark, image: '/images/cite-1.png' },
  { name: 'Cité', icon: MapPin, image: '/images/cite-1.png' },
  { name: 'Lotissement', icon: Grid3X3, image: '/images/chantier-1.png' },
  { name: 'Rénovation', icon: Hammer, image: '/images/interieur-1.png' },
  { name: 'Route', icon: Route, image: '/images/road-1.png' },
  { name: 'VRD', icon: Construction, image: '/images/chantier-1.png' },
  { name: 'Hydraulique', icon: Droplets, image: '/images/hydraulique-1.png' },
  { name: 'Étude', icon: FileText, image: '/images/plan-1.png' },
];

const popularModels: (CatalogModelData & { image: string })[] = [
  {
    id: '1', name: 'Villa Aurore', slug: 'villa-aurore', categoryId: 'villa',
    categoryName: 'Villa basse', mainImage: '/images/villa-1.png', images: ['/images/villa-1.png'],
    plans: [], levels: 1, bedrooms: 4, bathrooms: 3, surfaceArea: 220,
    minLandArea: 500, standing: 'Premium', equipment: ['Piscine', 'Garage', 'Climatisation', 'Cuisine américaine'],
    budgetMin: 55_000_000, budgetMax: 75_000_000, durationMin: 6, durationMax: 9,
    features: [], viewCount: 342, isPublished: true, isFeatured: true, image: '/images/villa-1.png',
  },
  {
    id: '2', name: 'Duplex Horizon', slug: 'duplex-horizon', categoryId: 'duplex',
    categoryName: 'Duplex', mainImage: '/images/duplex-1.png', images: ['/images/duplex-1.png'],
    plans: [], levels: 2, bedrooms: 5, bathrooms: 4, surfaceArea: 310,
    minLandArea: 400, standing: 'Luxe', equipment: ['Piscine', 'Garage double', 'Terrasse', 'Climatisation'],
    budgetMin: 85_000_000, budgetMax: 120_000_000, durationMin: 8, durationMax: 12,
    features: [], viewCount: 287, isPublished: true, isFeatured: true, image: '/images/duplex-1.png',
  },
  {
    id: '3', name: 'Immeuble Élysée', slug: 'immeuble-elysee', categoryId: 'immeuble',
    categoryName: 'Immeuble', mainImage: '/images/immeuble-1.png', images: ['/images/immeuble-1.png'],
    plans: [], levels: 4, bedrooms: 16, bathrooms: 16, surfaceArea: 1800,
    minLandArea: 600, standing: 'Luxe', equipment: ['Ascenseur', 'Parking sous-sol', 'Gardien', 'Climatisation centrale'],
    budgetMin: 350_000_000, budgetMax: 500_000_000, durationMin: 14, durationMax: 20,
    features: [], viewCount: 198, isPublished: true, isFeatured: true, image: '/images/immeuble-1.png',
  },
  {
    id: '4', name: 'Villa Émeraude', slug: 'villa-emeraude', categoryId: 'villa',
    categoryName: 'Villa basse', mainImage: '/images/villa-1.png', images: ['/images/villa-1.png'],
    plans: [], levels: 1, bedrooms: 3, bathrooms: 2, surfaceArea: 150,
    minLandArea: 350, standing: 'Standard', equipment: ['Garage', 'Cuisine équipée', 'Jardin'],
    budgetMin: 30_000_000, budgetMax: 45_000_000, durationMin: 4, durationMax: 7,
    features: [], viewCount: 456, isPublished: true, isFeatured: true, image: '/images/villa-1.png',
  },
  {
    id: '5', name: 'Cité Résidentielle', slug: 'cite-residentielle', categoryId: 'cite',
    categoryName: 'Cité', mainImage: '/images/cite-1.png', images: ['/images/cite-1.png'],
    plans: [], levels: 2, bedrooms: 3, bathrooms: 2, surfaceArea: 120,
    minLandArea: 200, standing: 'Économique', equipment: ['Garage', 'Espace vert'],
    budgetMin: 18_000_000, budgetMax: 28_000_000, durationMin: 5, durationMax: 8,
    features: [], viewCount: 521, isPublished: true, isFeatured: true, image: '/images/cite-1.png',
  },
];

const realizations = [
  { image: '/images/villa-1.png', title: 'Villa Cocody', category: 'Villa basse' },
  { image: '/images/duplex-1.png', title: 'Résidence Riviera', category: 'Duplex' },
  { image: '/images/immeuble-1.png', title: 'Immeuble Plateau', category: 'Immeuble' },
  { image: '/images/cite-1.png', title: 'Cité Marcory', category: 'Cité' },
  { image: '/images/interieur-1.png', title: 'Rénovation Villa', category: 'Rénovation' },
  { image: '/images/chantier-1.png', title: 'Lotissement Bingerville', category: 'Lotissement' },
];

const services = [
  { icon: Home, title: 'Construction maison', desc: 'Villas, duplex, triplex sur mesure' },
  { icon: Landmark, title: 'Immeuble R+', desc: 'Résidences et immeubles collectifs' },
  { icon: Landmark, title: 'Promotion', desc: 'Programmes immobiliers complets' },
  { icon: Hammer, title: 'Rénovation', desc: 'Réhabilitation et mise aux normes' },
  { icon: Route, title: 'VRD & Route', desc: 'Voirie, assainissement, réseau' },
  { icon: Droplets, title: 'Hydraulique', desc: 'Adduction d\'eau et forage' },
  { icon: FileText, title: 'Études techniques', desc: 'Faisabilité, avant-projet, BET' },
  { icon: Construction, title: 'Suivi de chantier', desc: 'Contrôle qualité et planning' },
];

const zones = [
  'Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro',
  'Daloa', 'Korhogo', 'Soubré', 'Anyama', 'Bingerville', 'Grand-Béréby',
];

const testimonials = [
  { name: 'Aminata K.', quote: 'Ma villa livrée dans les délais, qualité irréprochable. Je recommande.', role: 'Propriétaire, Cocody' },
  { name: 'Moussa D.', quote: 'Professionnalisme de A à Z. Le suivi de chantier est transparent et rigoureux.', role: 'Promoteur, Riviera' },
  { name: 'Fatou C.', quote: 'Notre immeuble R+ a été livré en 16 mois. Excellent rapport qualité-prix.', role: 'Investisseuse, Plateau' },
];

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function HomeView() {
  const navigate = useAppStore(s => s.navigate);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-screen min-h-[600px] max-h-[900px] w-full overflow-hidden">
        <img
          src="/images/hero-villa.png"
          alt="Villa moderne Côte d'Ivoire"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-16 md:pb-24 md:px-12 lg:px-20">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight"
          >
            Votre projet.<br />Bien construit.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="mt-4 text-white/70 text-base md:text-lg max-w-md"
          >
            Construction, architecture et promotion immobilière en Côte d'Ivoire.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 h-12 px-8 text-sm font-semibold"
              onClick={() => navigate('create')}
            >
              Décrire mon projet
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button
              size="lg"
              className="border border-white/70 bg-black/35 text-white hover:bg-black/50 h-12 px-8 text-sm font-semibold"
              onClick={() => navigate('explore')}
            >
              Explorer les modèles
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="px-6 md:px-12 lg:px-20">
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold tracking-tight">
            Nos catégories
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-2 text-muted-foreground text-sm">
            Trouvez le type de projet qui vous correspond.
          </motion.p>
        </div>
        <div className="mt-8 flex gap-3 overflow-x-auto no-scrollbar px-6 md:px-12 lg:px-20 md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible">
          {categories.map((cat) => (
            <motion.button
              key={cat.name}
              variants={fadeUp}
              onClick={() => navigate('explore', { type: cat.name })}
              className="flex-shrink-0 w-28 md:w-auto flex flex-col items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors"
            >
              <cat.icon className="size-6" />
              <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </AnimatedSection>

      {/* Popular Models */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="px-6 md:px-12 lg:px-20">
          <motion.div variants={fadeUp} className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Modèles populaires</h2>
              <p className="mt-2 text-muted-foreground text-sm">Les plus demandés ce mois.</p>
            </div>
            <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate('explore')}>
              Tout voir <ChevronRight className="size-4" />
            </Button>
          </motion.div>
        </div>
        <div className="mt-8 flex gap-4 overflow-x-auto no-scrollbar px-6 md:px-12 lg:px-20 md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible">
          {popularModels.map((model) => (
            <motion.div key={model.id} variants={fadeUp} className="flex-shrink-0 w-64 md:w-auto">
              <Card
                className="overflow-hidden cursor-pointer py-0 gap-0 border-border/50 hover:border-foreground/20 transition-colors"
                onClick={() => navigate('model-detail', { id: model.id })}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={model.image}
                    alt={model.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <Badge variant="secondary" className="absolute top-3 left-3 text-[10px] font-medium">
                    {model.standing}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm">{model.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{model.categoryName}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Maximize2 className="size-3" />{model.surfaceArea} m²</span>
                    <span className="flex items-center gap-1"><BedDouble className="size-3" />{model.bedrooms}</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold">
                    {FORMAT_SHORT_XOF(model.budgetMin!)} — {FORMAT_SHORT_XOF(model.budgetMax!)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 px-6 md:hidden">
          <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('explore')}>
            Voir tous les modèles <ChevronRight className="size-4" />
          </Button>
        </div>
      </AnimatedSection>

      {/* Réalisations */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="px-6 md:px-12 lg:px-20">
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold tracking-tight">
            Réalisations
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-2 text-muted-foreground text-sm">
            Projets livrés à travers la Côte d'Ivoire.
          </motion.p>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 px-6 md:px-12 lg:px-20">
          {realizations.map((r, i) => (
            <motion.div
              key={r.title}
              variants={fadeUp}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg ${i === 0 ? 'col-span-2 row-span-2 aspect-auto' : ''}`}
              onClick={() => navigate('realizations')}
            >
              <img
                src={r.image}
                alt={r.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <p className="text-white text-xs font-medium">{r.title}</p>
                <p className="text-white/60 text-[10px] mt-0.5">{r.category}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* Comment ça marche */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="px-6 md:px-12 lg:px-20">
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold tracking-tight">
            Comment ça marche
          </motion.h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-12 md:gap-8 px-6 md:px-12 lg:px-20">
          {[
            { num: '01', title: 'Décrivez', desc: 'Parlez-nous de votre projet : type, budget, terrain, envies.' },
            { num: '02', title: 'Étudions', desc: 'Nos ingénieurs analysent la faisabilité et vous proposent des solutions.' },
            { num: '03', title: 'Construisons', desc: 'Suivi rigoureux, respect des délais et qualité de livraison.' },
          ].map((step) => (
            <motion.div key={step.num} variants={fadeUp} className="text-center md:text-left">
              <span className="text-5xl md:text-6xl font-bold text-muted-foreground/30">{step.num}</span>
              <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* Services */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="px-6 md:px-12 lg:px-20">
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold tracking-tight">
            Nos services
          </motion.h2>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 px-6 md:px-12 lg:px-20">
          {services.map((s) => (
            <motion.div
              key={s.title}
              variants={fadeUp}
              className="p-5 rounded-xl border bg-card hover:bg-accent transition-colors cursor-pointer"
              onClick={() => navigate('services')}
            >
              <s.icon className="size-5" />
              <h3 className="mt-3 text-sm font-semibold">{s.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* Zones d'intervention */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="px-6 md:px-12 lg:px-20">
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold tracking-tight">
            Zones d'intervention
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-2 text-muted-foreground text-sm">
            Présents dans les principales villes de Côte d'Ivoire.
          </motion.p>
        </div>
        <div className="mt-8 flex flex-wrap gap-2 px-6 md:px-12 lg:px-20">
          {zones.map((z) => (
            <motion.div key={z} variants={fadeUp}>
              <Badge variant="outline" className="py-1.5 px-4 text-xs">
                <MapPinIcon className="size-3 mr-1" />{z}
              </Badge>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* Témoignages */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="px-6 md:px-12 lg:px-20">
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold tracking-tight">
            Ils nous font confiance
          </motion.h2>
        </div>
        <div className="mt-8 grid md:grid-cols-3 gap-4 px-6 md:px-12 lg:px-20">
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={fadeUp}>
              <Card className="py-0 gap-0 border-border/50 h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-foreground" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* CTA Final */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="px-6 md:px-12 lg:px-20">
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-foreground text-primary-foreground p-10 md:p-16 text-center"
          >
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              Prêt à construire ?
            </h2>
            <p className="mt-3 text-primary-foreground/60 text-sm md:text-base max-w-lg mx-auto">
              Décrivez votre projet en quelques minutes. Nous vous revenons sous 48h avec une première estimation.
            </p>
            <Button
              size="lg"
              className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-sm font-semibold"
              onClick={() => navigate('create')}
            >
              Démarrer mon projet
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="border-t py-12 px-6 md:px-12 lg:px-20">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="font-bold text-lg tracking-tight">BÂTI·CI</p>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Construction et architecture en Côte d'Ivoire. Villas, duplex, immeubles, VRD et promotion immobilière.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><Phone className="size-3" /> +225 07 00 00 00 00</div>
            <div className="flex items-center gap-2"><Mail className="size-3" /> contact@bati.ci</div>
            <div className="flex items-center gap-2"><MapPinIcon className="size-3" /> Abidjan, Côte d'Ivoire</div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t text-[11px] text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} BÂTI·CI. Tous droits réservés.</span>
          <span>Construction · Architecture · Promotion immobilière</span>
        </div>
      </footer>
    </main>
  );
}
