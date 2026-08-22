import type { ProjectData } from '@/types';

export function formatProjectLocation(project: Pick<ProjectData, 'city' | 'country'>, fallback = 'Localisation à préciser') {
  const city = project.city?.trim();
  const country = project.country?.trim();

  if (!city && !country) return fallback;
  if (!country || country === "Côte d'Ivoire") return city || country || fallback;
  if (!city) return country;
  return `${city}, ${country}`;
}
