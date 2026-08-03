import { validerSauvegarde, creerSauvegardeDefaut, creerFicheDefaut } from './save.js';
import { definirTheme, lireTheme } from './theme.js';
import { lireAffichageCompetences, definirAffichageCompetences } from './affichage_competences.js';

// --- Interface publique ---

export function rendreParametres(zone, catalogue, save, onSaveChange, remplacerSave) {
  zone.replaceChildren(
    construireSectionApparence(),
    construireSectionFiches(save, remplacerSave),
    construireSectionSauvegarde(catalogue, save, onSaveChange, remplacerSave),
  );
}

// --- Section Apparence ---

function construireSectionApparence() {
  const section = document.createElement('section');
  section.className = 'parametres-section';

  const titre = document.createElement('h2');
  titre.textContent = 'Apparence';
  section.appendChild(titre);

  const bloc = document.createElement('div');
  bloc.className = 'param-bloc';

  const label = document.createElement('label');
  label.className = 'param-label';
  label.htmlFor = 'select-theme';
  label.textContent = 'Thème';

  const select = document.createElement('select');
  select.id = 'select-theme';
  select.className = 'param-select';

  for (const [valeur, libelle] of [
    ['auto',   'Automatique (système)'],
    ['clair',  'Clair'],
    ['sombre', 'Sombre'],
  ]) {
    const opt = document.createElement('option');
    opt.value = valeur;
    opt.textContent = libelle;
    select.appendChild(opt);
  }

  select.value = lireTheme();
  select.addEventListener('change', () => definirTheme(select.value));

  bloc.append(label, select);
  section.appendChild(bloc);

  // Affichage des compétences
  const blocComp = document.createElement('div');
  blocComp.className = 'param-bloc';

  const labelComp = document.createElement('label');
  labelComp.className = 'param-label';
  labelComp.htmlFor = 'select-affichage-comp';
  labelComp.textContent = 'Affichage des compétences';

  const selectComp = document.createElement('select');
  selectComp.id = 'select-affichage-comp';
  selectComp.className = 'param-select';

  for (const [valeur, libelle] of [
    ['complet', 'Vue complète'],
    ['compact', 'Vue compacte'],
  ]) {
    const opt = document.createElement('option');
    opt.value = valeur;
    opt.textContent = libelle;
    selectComp.appendChild(opt);
  }

  selectComp.value = lireAffichageCompetences();
  selectComp.addEventListener('change', () => definirAffichageCompetences(selectComp.value));

  blocComp.append(labelComp, selectComp);
  section.appendChild(blocComp);
  return section;
}

// --- Section Fiches ---

function construireSectionFiches(save, remplacerSave) {
  const section = document.createElement('section');
  section.className = 'parametres-section';

  const titre = document.createElement('h2');
  titre.textContent = 'Fiches';
  section.appendChild(titre);

  section.append(
    blocNouvelleFiche(save, remplacerSave),
    blocSupprimerFiche(save, remplacerSave),
  );

  return section;
}

function blocNouvelleFiche(save, remplacerSave) {
  const { conteneur, bouton } = creerBloc(
    'Nouvelle fiche',
    'Crée une nouvelle fiche vide et bascule dessus.'
  );

  bouton.addEventListener('click', () => {
    const nouvelleFiche = creerFicheDefaut();
    nouvelleFiche.caracs.nom = 'Nouvelle fiche';
    save.sheets.push(nouvelleFiche);
    save.fiche_active = save.sheets.length - 1;
    remplacerSave(save);
  });

  return conteneur;
}

function blocSupprimerFiche(save, remplacerSave) {
  const { conteneur, bouton } = creerBloc(
    'Supprimer la fiche active',
    'Supprime définitivement la fiche actuellement sélectionnée.'
  );

  bouton.addEventListener('click', () => {
    const nomFiche = save.sheets[save.fiche_active].caracs.nom || 'Nouvelle fiche';
    if (!confirm(`Supprimer la fiche "${nomFiche}" ? Cette action est irréversible.`)) return;

    if (save.sheets.length === 1) {
      // Une seule fiche : remplacer par une fiche vide plutôt que supprimer
      save.sheets = [creerFicheDefaut()];
      save.fiche_active = 0;
    } else {
      save.sheets.splice(save.fiche_active, 1);
      save.fiche_active = Math.max(0, save.fiche_active - 1);
    }

    remplacerSave(save);
  });

  return conteneur;
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
