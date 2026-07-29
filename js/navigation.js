import { rendreParametres } from './parametres.js';
import { rendreGeneral }    from './general.js';
import { creerFicheDefaut } from './save.js';
import { rendreCapacites }  from './capacites.js';
import { rendreTalents }    from './talents.js';
import { rendreEquipement } from './equipement.js';
import { rendreObjets }    from './objets.js';
import { rendreCombat }   from './combat.js';

const SOUS_ONGLETS = [
  { id: 'general',    label: 'Général' },
  { id: 'combat',     label: 'Combat' },
  { id: 'capacites',  label: 'Capacités' },
  { id: 'talents',    label: 'Talents' },
  { id: 'equipement', label: 'Équipement' },
  { id: 'objets',     label: 'Objets' },
];

export function initialiserNavigation(conteneur, catalogue, saveInitiale, onSaveChange, availableFilters) {
  // save est mutable : remplacerSave peut le substituer entièrement
  let save = saveInitiale;
  // ongletActif : index numérique (fiche) ou 'regles' | 'parametres'
  let ongletActif = save.fiche_active;
  let sousOngletActif = 'general';

  function estFiche() {
    return typeof ongletActif === 'number';
  }

  // Remplace intégralement la sauvegarde (import, réinitialisation)
  function remplacerSave(nouvelleSave) {
    save = nouvelleSave;
    ongletActif = save.fiche_active;
    onSaveChange(save);
    rendre();
  }

  function changerOnglet(cible) {
    ongletActif = cible;
    if (typeof cible === 'number') {
      save.fiche_active = cible;
      onSaveChange(save);
    }
    rendre();
  }

  function changerSousOnglet(id) {
    sousOngletActif = id;
    rendre();
  }

  // Supprime la fiche à l'index donné (ou la remplace par une vide si c'est la dernière).
  // Place le focus sur l'onglet devenu actif après reconstruction.
  function supprimerFiche(ficheIndex) {
    const nomFiche = save.sheets[ficheIndex].caracs.nom || 'Nouvelle fiche';
    if (!confirm(`Supprimer la fiche "${nomFiche}" ? Cette action est irréversible.`)) return;

    if (save.sheets.length === 1) {
      save.sheets = [creerFicheDefaut()];
      save.fiche_active = 0;
    } else {
      save.sheets.splice(ficheIndex, 1);
      if (ficheIndex < save.fiche_active) {
        save.fiche_active = save.fiche_active - 1;
      } else if (ficheIndex === save.fiche_active) {
        save.fiche_active = Math.max(0, ficheIndex - 1);
      }
    }

    remplacerSave(save);
    // rendre() est terminé — le DOM est reconstruit, on peut placer le focus
    const btnActif = conteneur.querySelector('#nav-principal button.actif');
    if (btnActif) btnActif.focus();
  }

  // Raccourci clavier Delete — enregistré une seule fois
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Delete' || e.repeat) return;
    const active = document.activeElement;
    if (active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.tagName === 'SELECT' ||
      active.isContentEditable
    )) return;
    if (!estFiche()) return;
    supprimerFiche(save.fiche_active);
  });

  function rendreNavPrincipal() {
    const nav = document.createElement('nav');
    nav.id = 'nav-principal';

    save.sheets.forEach((fiche, i) => {
      const btn = document.createElement('button');
      btn.className = 'onglet' + (ongletActif === i ? ' actif' : '');
      btn.dataset.ficheIndex = i;

      const spanNom = document.createElement('span');
      spanNom.className = 'onglet-nom';
      spanNom.textContent = fiche.caracs.nom || 'Nouvelle fiche';

      const spanX = document.createElement('span');
      spanX.className = 'onglet-supprimer';
      spanX.setAttribute('aria-hidden', 'true');
      spanX.textContent = '×';

      btn.append(spanNom, spanX);
      btn.addEventListener('click', (e) => {
        if (e.target.closest('.onglet-supprimer')) {
          supprimerFiche(i);
        } else {
          changerOnglet(i);
        }
      });
      nav.appendChild(btn);
    });

    // Bouton création de nouvelle fiche
    const btnNouvelleF = document.createElement('button');
    btnNouvelleF.type = 'button';
    btnNouvelleF.className = 'btn-nouvelle-fiche';
    btnNouvelleF.textContent = '+';
    btnNouvelleF.setAttribute('aria-label', 'Créer une nouvelle fiche');
    btnNouvelleF.addEventListener('click', () => {
      const nf = creerFicheDefaut();
      nf.caracs.nom = 'Nouvelle fiche';
      save.sheets.push(nf);
      save.fiche_active = save.sheets.length - 1;
      remplacerSave(save);
    });
    nav.appendChild(btnNouvelleF);

    // Bouton accessible (masqué visuellement) — supprime la fiche active
    const btnSupprimerActive = document.createElement('button');
    btnSupprimerActive.type = 'button';
    btnSupprimerActive.className = 'sr-only';
    btnSupprimerActive.textContent = 'Supprimer la fiche active';
    if (!estFiche()) btnSupprimerActive.disabled = true;
    btnSupprimerActive.addEventListener('click', () => {
      if (estFiche()) supprimerFiche(save.fiche_active);
    });
    nav.appendChild(btnSupprimerActive);

    // Séparateur pour pousser les onglets fixes à droite
    const sep = document.createElement('span');
    sep.className = 'onglet-sep';
    nav.appendChild(sep);

    for (const [id, label] of [['regles', 'Règles'], ['parametres', 'Paramètres']]) {
      const btn = document.createElement('button');
      btn.className = 'onglet onglet-fixe' + (ongletActif === id ? ' actif' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => changerOnglet(id));
      nav.appendChild(btn);
    }

    return nav;
  }

  function rendreNavSecondaire() {
    const nav = document.createElement('nav');
    nav.id = 'nav-secondaire';

    SOUS_ONGLETS.forEach(({ id, label }) => {
      const btn = document.createElement('button');
      btn.className = 'sous-onglet' + (sousOngletActif === id ? ' actif' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => changerSousOnglet(id));
      nav.appendChild(btn);
    });

    return nav;
  }

  function rendreContenu() {
    const zone = document.createElement('div');
    zone.id = 'contenu-onglet';

    if (ongletActif === 'parametres') {
      rendreParametres(zone, catalogue, save, onSaveChange, remplacerSave);
    } else if (estFiche() && sousOngletActif === 'general') {
      rendreGeneral(zone, catalogue, save, onSaveChange);
    } else if (estFiche() && sousOngletActif === 'combat') {
      rendreCombat(zone, catalogue, save, onSaveChange);
    } else if (estFiche() && sousOngletActif === 'capacites') {
      rendreCapacites(zone, catalogue, save, onSaveChange, availableFilters);
    } else if (estFiche() && sousOngletActif === 'talents') {
      rendreTalents(zone, catalogue, save, onSaveChange, availableFilters);
    } else if (estFiche() && sousOngletActif === 'equipement') {
      rendreEquipement(zone, catalogue, save, onSaveChange, availableFilters);
    } else if (estFiche() && sousOngletActif === 'objets') {
      rendreObjets(zone, catalogue, save, onSaveChange, availableFilters);
    } else {
      const div = document.createElement('div');
      div.dataset.tab = estFiche()
        ? `fiche-${ongletActif}-${sousOngletActif}`
        : ongletActif;
      zone.appendChild(div);
    }

    return zone;
  }

  function rendre() {
    const enfants = [rendreNavPrincipal()];
    if (estFiche()) enfants.push(rendreNavSecondaire());
    enfants.push(rendreContenu());
    conteneur.replaceChildren(...enfants);
  }

  rendre();
}
