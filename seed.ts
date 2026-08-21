import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.chantierReport.deleteMany();
  await prisma.chantier.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.projectMessage.deleteMany();
  await prisma.projectDocument.deleteMany();
  await prisma.terrain.deleteMany();
  await prisma.project.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.catalogModelSimilar.deleteMany();
  await prisma.catalogModel.deleteMany();
  await prisma.projectCategory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.anonymousDraft.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.formQuestion.deleteMany();

  // === Categories ===
  const categories = await Promise.all([
    prisma.projectCategory.create({ data: { name: 'Villa basse', slug: 'villa-basse', icon: 'Home', order: 1, description: 'Maisons individuelles à un niveau' } }),
    prisma.projectCategory.create({ data: { name: 'Duplex', slug: 'duplex', icon: 'Building2', order: 2, description: 'Maisons à deux niveaux' } }),
    prisma.projectCategory.create({ data: { name: 'Triplex', slug: 'triplex', icon: 'Building', order: 3, description: 'Maisons à trois niveaux' } }),
    prisma.projectCategory.create({ data: { name: 'Immeuble', slug: 'immeuble', icon: 'Landmark', order: 4, description: 'Bâtiments collectifs' } }),
    prisma.projectCategory.create({ data: { name: 'Promotion immobilière', slug: 'promotion-immobiliere', icon: 'City', order: 5, description: 'Programmes immobiliers' } }),
    prisma.projectCategory.create({ data: { name: 'Cité résidentielle', slug: 'cite-residentielle', icon: 'MapPin', order: 6, description: 'Ensembles résidentiels' } }),
    prisma.projectCategory.create({ data: { name: 'Rénovation', slug: 'renovation', icon: 'Hammer', order: 7, description: 'Rénovation et réhabilitation' } }),
    prisma.projectCategory.create({ data: { name: 'VRD', slug: 'vrd', icon: 'Construction', order: 8, description: 'Voirie et réseaux divers' } }),
    prisma.projectCategory.create({ data: { name: 'Hydraulique', slug: 'hydraulique', icon: 'Droplets', order: 9, description: 'Projets d\'eau et assainissement' } }),
    prisma.projectCategory.create({ data: { name: 'Bureaux', slug: 'bureaux', icon: 'Briefcase', order: 10, description: 'Espaces professionnels' } }),
    prisma.projectCategory.create({ data: { name: 'Hôtel', slug: 'hotel', icon: 'Hotel', order: 11, description: 'Établissements hôteliers' } }),
    prisma.projectCategory.create({ data: { name: 'Étude technique', slug: 'etude-technique', icon: 'FileText', order: 12, description: 'Études et expertises' } }),
  ]);

  console.log(`✅ ${categories.length} catégories créées`);

  // === Users ===
  const admin = await prisma.user.create({
    data: { name: 'Diabaté Ibrahim', email: 'admin@bati.ci', phone: '+22501020304', passwordHash: 'hashed', type: 'admin', role: 'super_admin', emailVerified: true, phoneVerified: true },
  });
  await prisma.employeeProfile.create({ data: { userId: admin.id, poste: 'Directeur Général', departement: 'Direction', specialite: 'Management BTP' } });

  const clients = await Promise.all([
    prisma.user.create({ data: { name: 'Kouamé Adama', phone: '+22507080910', type: 'client', role: 'client', phoneVerified: true } }),
    prisma.user.create({ data: { name: 'Diallo Moussa', email: 'diallo@email.ci', phone: '+22505060708', type: 'client', role: 'client', phoneVerified: true } }),
    prisma.user.create({ data: { name: 'Koné Fatou', phone: '+22507987654', type: 'client', role: 'client', phoneVerified: true } }),
  ]);

  for (const c of clients) {
    await prisma.clientProfile.create({ data: { userId: c.id, clientType: 'particulier', ville: 'Abidjan' } });
  }

  console.log(`✅ ${clients.length + 1} utilisateurs créés`);

  // === Catalog Models ===
  const models = await Promise.all([
    prisma.catalogModel.create({
      data: {
        name: 'Villa Émeraude', slug: 'villa-emeraude', description: 'Villa luxueuse avec piscine, 4 chambres et jardin tropical.', categoryId: categories[0].id,
        mainImage: '/images/villa-1.png', images: JSON.stringify(['/images/villa-1.png', '/images/interieur-1.png']), plans: JSON.stringify(['/images/plan-1.png']),
        levels: 1, rooms: 8, bedrooms: 4, bathrooms: 3, surfaceArea: 280, minLandArea: 500,
        standing: 'luxe', style: 'Contemporain',
        equipment: JSON.stringify(['Piscine', 'Garage 2 véhicules', 'Jardin', 'Climatisation', 'Cuisine américaine', 'Dressing', 'Buanderie', 'Guérite', 'Clôture']),
        budgetMin: 80000000, budgetMax: 120000000, durationMin: 8, durationMax: 12,
        features: JSON.stringify(['Baies vitrées', 'Terrasse couverte', 'Suite parentale', 'Suite avec SDE', 'Dépendance', 'Parking visiteurs']),
        isPublished: true, isFeatured: true, viewCount: 234, selectCount: 12,
      },
    }),
    prisma.catalogModel.create({
      data: {
        name: 'Duplex Horizon', slug: 'duplex-horizon', description: 'Duplex moderne avec vue panoramique, 3 chambres et terrasse.', categoryId: categories[1].id,
        mainImage: '/images/duplex-1.png', images: JSON.stringify(['/images/duplex-1.png', '/images/interieur-1.png']),
        levels: 2, rooms: 6, bedrooms: 3, bathrooms: 2, surfaceArea: 200, minLandArea: 300,
        standing: 'premium', style: 'Moderne',
        equipment: JSON.stringify(['Garage', 'Terrasse', 'Climatisation', 'Cuisine fermée', 'Dressing', 'Buanderie']),
        budgetMin: 45000000, budgetMax: 65000000, durationMin: 6, durationMax: 9,
        features: JSON.stringify(['Balcon', 'Terrasse RDC', 'Suite parentale', 'Espace vert']),
        isPublished: true, isFeatured: true, viewCount: 189, selectCount: 8,
      },
    }),
    prisma.catalogModel.create({
      data: {
        name: 'Immeuble Skyline', slug: 'immeuble-skyline', description: 'Immeuble R+4 avec ascenseur, 12 appartements et parking souterrain.', categoryId: categories[3].id,
        mainImage: '/images/immeuble-1.png', images: JSON.stringify(['/images/immeuble-1.png']),
        levels: 5, rooms: 48, bedrooms: 24, bathrooms: 24, surfaceArea: 2400, minLandArea: 600,
        standing: 'premium', style: 'Contemporain',
        equipment: JSON.stringify(['Ascenseur', 'Parking souterrain', 'Groupe électrogène', 'Vidéosurveillance', 'Espaces verts']),
        budgetMin: 300000000, budgetMax: 500000000, durationMin: 18, durationMax: 24,
        features: JSON.stringify(['F2 à F5', 'Balcons', 'Locaux commerciaux RDC', 'Gardien', 'Sécurité incendie']),
        isPublished: true, isFeatured: true, viewCount: 156, selectCount: 5,
      },
    }),
    prisma.catalogModel.create({
      data: {
        name: 'Cité Palmiers', slug: 'cite-palmiers', description: 'Cité résidentielle de 20 villas avec espaces communs et piscine.', categoryId: categories[5].id,
        mainImage: '/images/cite-1.png', images: JSON.stringify(['/images/cite-1.png', '/images/villa-1.png']),
        levels: 1, rooms: 0, surfaceArea: 8000, minLandArea: 5000,
        standing: 'luxe', style: 'Provençal',
        equipment: JSON.stringify(['Piscine collective', 'Aire de jeux', 'Vidéosurveillance', 'Guérites', 'Espaces verts', 'Parking visiteurs']),
        budgetMin: 1500000000, budgetMax: 2500000000, durationMin: 24, durationMax: 36,
        features: JSON.stringify(['20 villas', 'Réseaux complets', 'Éclairage public', 'Drainage', 'Zone de collecte']),
        isPublished: true, isFeatured: true, viewCount: 312, selectCount: 18,
      },
    }),
    prisma.catalogModel.create({
      data: {
        name: 'Bureaux Modern', slug: 'bureaux-modern', description: 'Immeuble de bureaux R+3 avec parking et espaces partagés.', categoryId: categories[9].id,
        mainImage: '/images/bureau-1.png', images: JSON.stringify(['/images/bureau-1.png']),
        levels: 4, surfaceArea: 1200, minLandArea: 400,
        standing: 'standard', style: 'Corporate',
        equipment: JSON.stringify(['Ascenseur', 'Parking', 'Climatisation centrale', 'Salle de réunion', 'Vidéosurveillance']),
        budgetMin: 150000000, budgetMax: 250000000, durationMin: 12, durationMax: 18,
        features: JSON.stringify(['Open space', 'Bureaux cloisonnés', 'Salle serveur', 'Cafétéria']),
        isPublished: true, isFeatured: false, viewCount: 98, selectCount: 3,
      },
    }),
    prisma.catalogModel.create({
      data: {
        name: 'Hôtel Prestige', slug: 'hotel-prestige', description: 'Hôtel 4 étoiles avec 50 chambres, restaurant et piscine.', categoryId: categories[10].id,
        mainImage: '/images/hotel-1.png', images: JSON.stringify(['/images/hotel-1.png', '/images/interieur-1.png']),
        levels: 4, surfaceArea: 3500, minLandArea: 2000,
        standing: 'luxe', style: 'Luxe',
        equipment: JSON.stringify(['Restaurant', 'Bar', 'Piscine', 'Salle de conférence', 'Parking', 'Gym', 'Spa']),
        budgetMin: 500000000, budgetMax: 800000000, durationMin: 18, durationMax: 24,
        features: JSON.stringify(['50 chambres', 'Suite présidentielle', 'Espaces événementiels', 'Cuisine professionnelle']),
        isPublished: true, isFeatured: false, viewCount: 67, selectCount: 2,
      },
    }),
    prisma.catalogModel.create({
      data: {
        name: 'Villa Éco', slug: 'villa-eco', description: 'Villa économique 3 chambres, idéale pour les jeunes ménages.', categoryId: categories[0].id,
        mainImage: '/images/villa-1.png', images: JSON.stringify(['/images/villa-1.png']),
        levels: 1, rooms: 5, bedrooms: 3, bathrooms: 1, surfaceArea: 120, minLandArea: 200,
        standing: 'economique', style: 'Simple',
        equipment: JSON.stringify(['Garage', 'Cour', 'Cuisine fermée']),
        budgetMin: 15000000, budgetMax: 25000000, durationMin: 4, durationMax: 6,
        features: JSON.stringify(['Salon', '2 chambres standards', '1 suite', 'Toiture tôles']),
        isPublished: true, isFeatured: false, viewCount: 267, selectCount: 15,
      },
    }),
    prisma.catalogModel.create({
      data: {
        name: 'Duplex Zenith', slug: 'duplex-zenith', description: 'Duplex standing avec piscine privée et vue panoramique.', categoryId: categories[1].id,
        mainImage: '/images/duplex-1.png', images: JSON.stringify(['/images/duplex-1.png', '/images/villa-1.png']),
        levels: 2, rooms: 7, bedrooms: 4, bathrooms: 3, surfaceArea: 250, minLandArea: 400,
        standing: 'luxe', style: 'Contemporain',
        equipment: JSON.stringify(['Piscine', 'Garage 2 véhicules', 'Terrasse panoramique', 'Climatisation', 'Dressing', 'Buanderie']),
        budgetMin: 75000000, budgetMax: 100000000, durationMin: 7, durationMax: 10,
        features: JSON.stringify(['Suite parentale avec balcon', 'Cuisine américaine équipée', 'Jardin paysager']),
        isPublished: true, isFeatured: true, viewCount: 145, selectCount: 7,
      },
    }),
  ]);

  console.log(`✅ ${models.length} modèles créés`);

  // === Projects ===
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        referenceNumber: 'PRJ-2024-0042', userId: clients[0].id, modelId: models[0].id, categoryId: categories[0].id,
        title: 'Villa Kokora Cocody', status: 'in_progress', progress: 45,
        city: 'Cocody', commune: 'Cocody', quartier: 'Riviera Palmeraie',
        budgetMin: 80000000, budgetMax: 120000000, desiredStart: new Date('2024-01-10'), duration: 10,
        formData: JSON.stringify({ type: 'villa-basse', terrainStatus: 'owned', surfaceArea: 600, levels: 1, bedrooms: 4, standing: 'luxe' }),
      },
    }),
    prisma.project.create({
      data: {
        referenceNumber: 'PRJ-2024-0041', userId: clients[0].id, modelId: models[2].id, categoryId: categories[3].id,
        title: 'Résidence Palmiers', status: 'study', progress: 15,
        city: 'Plateau', budgetMin: 300000000, budgetMax: 500000000,
        formData: JSON.stringify({ type: 'immeuble', levels: 5, appartments: 12 }),
      },
    }),
    prisma.project.create({
      data: {
        referenceNumber: 'PRJ-2024-0040', userId: clients[1].id, modelId: models[1].id, categoryId: categories[1].id,
        title: 'Duplex Familial Riviera', status: 'accepted', progress: 10,
        city: 'Riviera', budgetMin: 45000000, budgetMax: 65000000,
        formData: JSON.stringify({ type: 'duplex', terrainStatus: 'acquiring', levels: 2, bedrooms: 3, standing: 'premium' }),
      },
    }),
    prisma.project.create({
      data: {
        referenceNumber: 'PRJ-2024-0039', userId: clients[2].id, modelId: models[7].id, categoryId: categories[1].id,
        title: 'Duplex Zenith Yopougon', status: 'delivered', progress: 100,
        city: 'Yopougon', budgetMin: 75000000, budgetMax: 100000000,
        formData: JSON.stringify({ type: 'duplex', levels: 2, bedrooms: 4, standing: 'luxe' }),
      },
    }),
  ]);

  console.log(`✅ ${projects.length} projets créés`);

  // === Notifications ===
  await prisma.notification.createMany({
    data: [
      { userId: clients[0].id, title: 'Projet démarré', message: 'Votre villa Kokora a été mise en chantier.', type: 'info', link: 'project-detail', isRead: false },
      { userId: clients[0].id, title: 'Rapport disponible', message: 'Le rapport hebdomadaire de votre chantier est prêt.', type: 'action', link: 'project-detail', isRead: false },
      { userId: clients[0].id, title: 'Rendez-vous confirmé', message: 'Visite de chantier programmée le 22/01.', type: 'info', link: 'project-detail', isRead: true },
      { userId: clients[1].id, title: 'Devis disponible', message: 'Votre devis pour le duplex familial est prêt.', type: 'action', link: 'project-detail', isRead: false },
      { userId: clients[1].id, title: 'Bienvenue', message: 'Bienvenue sur BÂTI·CI. Décrivez votre projet !', type: 'info', isRead: true },
      { userId: clients[2].id, title: 'Projet livré', message: 'Votre duplex Zenith a été livré avec succès.', type: 'success', link: 'project-detail', isRead: false },
    ],
  });

  console.log('✅ Notifications créées');

  // === Site Settings ===
  await prisma.siteSetting.createMany({
    data: [
      { key: 'company_name', value: 'BÂTI·CI', type: 'string' },
      { key: 'company_slogan', value: 'Votre projet. Bien construit.', type: 'string' },
      { key: 'company_phone', value: '+225 01 02 03 04', type: 'string' },
      { key: 'company_email', value: 'contact@bati.ci', type: 'string' },
      { key: 'currency', value: 'XOF', type: 'string' },
      { key: 'country', value: 'Côte d\'Ivoire', type: 'string' },
    ],
  });

  console.log('✅ Paramètres créés');
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
