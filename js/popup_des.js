// Toast singleton affichant le dernier résultat de jet de dé.
// Écoute le CustomEvent 'de-lance' diffusé par dice.js.
// Clic sur le toast → fermeture immédiate.

import { prefixeJet, texteAvDes, texteCritique } from './messages_des.js';

// Passer à true pour réactiver le toast dans une prochaine version.
const ACTIF = false;

const DELAI_MS = 4000;
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

    // TODO: brancher l'annonce lecteur d'écran ici via le futur module
    // d'annonce dédié (double région aria-live alternée) — ne pas utiliser
    // aria-live directement sur le toast.
    popup.append(spanPrefixe, spanTotal);

    const txAvDes = texteAvDes(entry.avDes);
    if (txAvDes) {
      const span = document.createElement('span');
      span.className = 'popup-de-avdes';
      span.textContent = ` ${txAvDes}`;
      popup.appendChild(span);
    }

    const txCrit = texteCritique(entry.critique);
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
