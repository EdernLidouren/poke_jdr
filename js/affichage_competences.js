// Préférence d'affichage du bloc Compétences, persistée dans le localStorage.
// Valeurs : 'complet' (défaut) | 'compact'

const CLE = 'pokefiche_affichage_competences';
const VALEURS = ['complet', 'compact'];

export function lireAffichageCompetences() {
  const val = localStorage.getItem(CLE);
  return VALEURS.includes(val) ? val : 'complet';
}

export function definirAffichageCompetences(valeur) {
  if (!VALEURS.includes(valeur)) return;
  localStorage.setItem(CLE, valeur);
  document.dispatchEvent(new CustomEvent('affichage-competences-change'));
}
