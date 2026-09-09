export type ProjectGroupId = 'batiment' | 'travaux-publics';

export const PROJECT_GROUP_LABELS: Record<ProjectGroupId, string> = {
  batiment: 'Bâtiment',
  'travaux-publics': 'Travaux publics',
};

export const PROJECT_TYPE_GROUPS: Record<string, ProjectGroupId> = {
  'maison-basse': 'batiment',
  'duplex-triplex': 'batiment',
  'immeuble-rplus': 'batiment',
  promotion: 'batiment',
  'lot-travaux': 'batiment',
  renovation: 'batiment',
  'etude-suivi': 'batiment',
  autre: 'batiment',
  vrd: 'travaux-publics',
  hydraulique: 'travaux-publics',
};

const PUBLIC_WORKS_TERMS = [
  'vrd',
  'route',
  'voirie',
  'reseau',
  'réseau',
  'hydraulique',
  'assainissement',
  'drainage',
  'lotissement',
  'amenagement',
  'aménagement',
];

export function getProjectGroupForType(projectType?: string): ProjectGroupId | undefined {
  if (!projectType) return undefined;
  return PROJECT_TYPE_GROUPS[projectType];
}

export function getProjectGroupForCatalog(categoryId?: string, categoryName?: string): ProjectGroupId {
  const value = `${categoryId || ''} ${categoryName || ''}`.toLowerCase();
  return PUBLIC_WORKS_TERMS.some(term => value.includes(term)) ? 'travaux-publics' : 'batiment';
}
