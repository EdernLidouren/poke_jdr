// Popup singleton affichant le dernier résultat de jet de dé.
// Écoute le CustomEvent 'de-lance' diffusé par dice.js.

import { prefixeJet, texteAvDes, texteCritique } from './messages_des.js';

const DELAI_MS = 3500;
const TRANSITION_MS = 350;

export function initPopupDes() {
  const popup = document.createElement('div');
  popup.id = 'popup-de';
  popup.setAttribute('role', 'status');
  popup.setAttribute('aria-live', 'assertive');
  popup.setAttribute('aria-atomic', 'true');
  popup.hidden = true;
  document.body.appendChild(popup);

  let timerMasque = null;
  let timerCacher = null;

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

    timerMasque = setTimeout(() => {
      popup.classList.add('popup-de-masque');
      timerCacher = setTimeout(() => {
        popup.hidden = true;
        popup.classList.remove('popup-de-masque');
      }, TRANSITION_MS);
    }, DELAI_MS);
  });
}
