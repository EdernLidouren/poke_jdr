// Gestion du thème (clair / sombre / automatique)

const CLE_THEME = 'pokefiche_theme';
const VALEURS_VALIDES = ['auto', 'clair', 'sombre'];

/**
 * Lit la préférence stockée et applique la classe correspondante sur <body>.
 * À appeler le plus tôt possible, avant le premier rendu.
 */
export function chargerTheme() {
  _appliquerTheme(localStorage.getItem(CLE_THEME) || 'auto');
}

/**
 * Enregistre la préférence et l'applique immédiatement.
 */
export function definirTheme(valeur) {
  if (!VALEURS_VALIDES.includes(valeur)) return;
  localStorage.setItem(CLE_THEME, valeur);
  _appliquerTheme(valeur);
}

/**
 * Retourne la préférence stockée ('auto' par défaut).
 */
export function lireTheme() {
  return localStorage.getItem(CLE_THEME) || 'auto';
}

function _appliquerTheme(valeur) {
  document.body.classList.remove('theme-clair', 'theme-sombre');
  if (valeur === 'clair')  document.body.classList.add('theme-clair');
  if (valeur === 'sombre') document.body.classList.add('theme-sombre');
  // 'auto' : aucune classe → prefers-color-scheme prend le relais via CSS
}
