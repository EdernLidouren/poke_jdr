// Toast singleton affichant le dernier résultat de jet de dé.
// Écoute le CustomEvent 'de-lance' diffusé par dice.js.
// Clic sur le toast → fermeture immédiate.

import { prefixeJet, texteAvDes, texteCritique } from './messages_des.js';
import { annoncer } from './annonce.js';

const ACTIF = true;

const DELAI_MS = 8000;
const TRANSITION_MS = 350;

export function initPopupDes() {
  if (!ACTIF) return;

  const popup = document.createElement('div');
  popup.id = 'popup-de';
  // Pas d'aria-live sur le toast — l'annonce lecteur d'écran sera gérée
  // par un module dédié (double région aria-live alternée) plus tard.
  popup.hidden = true;
  document.body.appendChild(popup);

  let timerMasque = null;
  let timerCacher = null;

  function masquer() {
    clearTimeout(timerMasque);
    clearTimeout(timerCacher);
    popup.classList.add('popup-de-masque');
    timerCacher = setTimeout(() => {
      popup.hidden = true;
      popup.classList.remove('popup-de-masque');
    }, TRANSITION_MS);
  }

  popup.addEventListener('click', masquer);

  document.addEventListener('de-lance', ({ detail: entry }) => {
    clearTimeout(timerMasque);
    clearTimeout(timerCacher);

    popup.replaceChildren();

    const spanPrefixe = document.createElement('span');
    spanPrefixe.className = 'popup-de-prefixe';
    spanPrefixe.textContent = prefixeJet(entry);

    const spanTotal = document.createElement('span');
    spanTotal.className = 'popup-de-total';
    spanTotal.textContent = String(entry.total);

    const txAvDes = texteAvDes(entry.avDes);
    const txCrit  = texteCritique(entry.critique);

    // Annonce au lecteur d'écran — même texte que le toast visuel.
    annoncer(
      prefixeJet(entry) + String(entry.total)
      + (txAvDes ? ' ' + txAvDes : '')
      + (txCrit  ? ' ' + txCrit  : ''),
      'assertive'
    );

    popup.append(spanPrefixe, spanTotal);

    if (txAvDes) {
      const span = document.createElement('span');
      span.className = 'popup-de-avdes';
      span.textContent = ` ${txAvDes}`;
      popup.appendChild(span);
    }

    if (txCrit) {
      const span = document.createElement('span');
      span.className = 'popup-de-critique';
      span.classList.add(entry.critique === 'réussite' ? 'popup-de-reussite' : 'popup-de-echec');
      span.textContent = ` ${txCrit}`;
      popup.appendChild(span);
    }

    popup.classList.remove('popup-de-masque');
    popup.hidden = false;

    timerMasque = setTimeout(masquer, DELAI_MS);
  });
}
