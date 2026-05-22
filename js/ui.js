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

export function afficherInterfacePrincipale(sauvegarde) {
  const titre = document.createElement('h1');
  titre.textContent = 'Pokefiche';

  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(sauvegarde, null, 2);

  app.replaceChildren(titre, pre);
}
