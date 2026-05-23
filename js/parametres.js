import { validerSauvegarde, creerSauvegardeDefaut } from './save.js';

// --- Interface publique ---

export function rendreParametres(zone, catalogue, save, onSaveChange, remplacerSave) {
  zone.replaceChildren(construireSectionSauvegarde(catalogue, save, onSaveChange, remplacerSave));
}

// --- Section Sauvegarde ---

function construireSectionSauvegarde(catalogue, save, onSaveChange, remplacerSave) {
  const section = document.createElement('section');
  section.className = 'parametres-section';

  const titre = document.createElement('h2');
  titre.textContent = 'Sauvegarde';
  section.appendChild(titre);

  const zoneErreur = document.createElement('p');
  zoneErreur.className = 'param-erreur';
  zoneErreur.hidden = true;

  section.append(
    blocSauvegarder(save, onSaveChange),
    blocExporter(save),
    blocImporter(catalogue, remplacerSave, zoneErreur),
    blocReinitialiser(remplacerSave),
    zoneErreur
  );

  return section;
}

// --- Blocs ---

function creerBloc(labelBouton, description) {
  const div = document.createElement('div');
  div.className = 'param-bloc';

  const btn = document.createElement('button');
  btn.className = 'param-btn';
  btn.textContent = labelBouton;

  const desc = document.createElement('span');
  desc.className = 'param-desc';
  desc.textContent = description;

  div.append(btn, desc);
  return { conteneur: div, bouton: btn };
}

function blocSauvegarder(save, onSaveChange) {
  const { conteneur, bouton } = creerBloc(
    'Sauvegarder',
    'Écrit immédiatement l\'état actuel dans le navigateur.'
  );

  const confirmation = document.createElement('span');
  confirmation.className = 'param-confirmation';
  confirmation.hidden = true;
  conteneur.appendChild(confirmation);

  bouton.addEventListener('click', () => {
    onSaveChange(save);
    afficherConfirmation(confirmation, 'Sauvegarde effectuée');
  });

  return conteneur;
}

function blocExporter(save) {
  const { conteneur, bouton } = creerBloc(
    'Exporter',
    'Télécharge la sauvegarde dans un fichier pokefiche.pks.'
  );
  bouton.addEventListener('click', () => exporter(save));
  return conteneur;
}

function blocImporter(catalogue, remplacerSave, zoneErreur) {
  const { conteneur, bouton } = creerBloc(
    'Importer',
    'Charge une sauvegarde depuis un fichier .pks. Remplace les données actuelles.'
  );
  bouton.addEventListener('click', () => importer(catalogue, remplacerSave, zoneErreur));
  return conteneur;
}

function blocReinitialiser(remplacerSave) {
  const { conteneur, bouton } = creerBloc(
    'Réinitialiser',
    'Efface toutes les données et repart d\'une fiche vide.'
  );
  bouton.addEventListener('click', () => reinitialiser(remplacerSave));
  return conteneur;
}

// --- Actions ---

function afficherConfirmation(span, message) {
  span.textContent = message;
  span.hidden = false;
  setTimeout(() => { span.hidden = true; }, 2000);
}

function afficherErreur(zone, message) {
  zone.textContent = message;
  zone.hidden = false;
  setTimeout(() => { zone.hidden = true; }, 6000);
}

function exporter(save) {
  const json = JSON.stringify(save, null, 2);
  const blob = new Blob([json], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pokefiche.pks';
  a.click();
  URL.revokeObjectURL(url);
}

function importer(catalogue, remplacerSave, zoneErreur) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pks';

  input.addEventListener('change', () => {
    const fichier = input.files[0];
    if (!fichier) return;

    const lecteur = new FileReader();
    lecteur.onload = (ev) => {
      let parsed;
      try {
        parsed = JSON.parse(ev.target.result);
      } catch {
        afficherErreur(zoneErreur, 'Fichier invalide : impossible de lire le contenu JSON.');
        return;
      }

      const validee = validerSauvegarde(parsed, catalogue);
      if (validee === null) {
        afficherErreur(zoneErreur, 'Sauvegarde invalide : la structure du fichier n\'est pas reconnue.');
        return;
      }

      remplacerSave(validee);
    };

    lecteur.readAsText(fichier);
  });

  input.click();
}

function reinitialiser(remplacerSave) {
  if (!confirm('Réinitialiser effacera toutes les données. Continuer ?')) return;
  remplacerSave(creerSauvegardeDefaut());
}
