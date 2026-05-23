import { initialiserNavigation } from './navigation.js';

const app = document.getElementById('app');

export function afficherErreurChargement(message) {
  const div = document.createElement('div');
  div.className = 'erreur';

  const titre = document.createElement('h2');
  titre.textContent = 'Erreur de chargement';

  const para = document.createElement('p');
  para.textContent = message;

  div.append(titre, para);
  app.replaceChildren(div);
}

export function afficherInterfacePrincipale(catalogue, sauvegarde, onSaveChange) {
  app.replaceChildren();
  initialiserNavigation(app, catalogue, sauvegarde, onSaveChange);
}
