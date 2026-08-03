// Module d'annonce pour lecteurs d'écran.
//
// Technique des deux régions aria-live alternées : à chaque appel, le contenu
// est injecté dans la région qui n'a PAS été utilisée au tour précédent. Cela
// garantit un changement de nœud de texte détectable par l'API d'accessibilité,
// même si le message est identique au précédent ou que deux jets se suivent
// rapidement.
//
// Les deux régions (#sr-annonce-0, #sr-annonce-1) sont déclarées dans index.html
// dès le parsing, pour que les AT les enregistrent avant tout appel JavaScript.

const DELAI_INJECTION_MS = 50; // délai entre vidage et injection (ms)

// Références mises en cache à la première utilisation.
let region0 = null;
let region1 = null;

// Index de la région utilisée au dernier appel (0 ou 1).
// L'alternance se fait en basculant vers 1 - indexPrecedent.
let indexPrecedent = 0;

function obtenirRegions() {
  if (!region0) region0 = document.getElementById('sr-annonce-0');
  if (!region1) region1 = document.getElementById('sr-annonce-1');
  return [region0, region1];
}

/**
 * Annonce un texte au lecteur d'écran via les deux régions aria-live alternées.
 *
 * @param {string} texte   - Texte à annoncer.
 * @param {string} niveau  - 'polite' (défaut) ou 'assertive'.
 */
export function annoncer(texte, niveau = 'polite') {
  // Sanitizing léger : trim + normalisation des espaces internes multiples.
  const sanitise = String(texte).trim().replace(/\s+/g, ' ');
  if (!sanitise) return;

  const [r0, r1] = obtenirRegions();
  if (!r0 || !r1) return;

  const regions = [r0, r1];

  // Vider la région précédente (celle qui contient l'ancien message).
  regions[indexPrecedent].textContent = '';

  // Basculer vers l'autre région.
  const cible = 1 - indexPrecedent;
  indexPrecedent = cible;

  // Court délai pour laisser l'API d'accessibilité enregistrer le vidage
  // avant d'injecter le nouveau contenu dans la région cible.
  setTimeout(() => {
    regions[cible].setAttribute('aria-live', niveau);
    regions[cible].textContent = sanitise;
  }, DELAI_INJECTION_MS);
}
