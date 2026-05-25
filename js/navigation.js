import { rendreParametres } from './parametres.js';
import { rendreGeneral }    from './general.js';
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

  function rendreNavPrincipal() {
    const nav = document.createElement('nav');
    nav.id = 'nav-principal';

    save.sheets.forEach((fiche, i) => {
      const btn = document.createElement('button');
      btn.className = 'onglet' + (ongletActif === i ? ' actif' : '');
      btn.dataset.ficheIndex = i;
      btn.textContent = fiche.caracs.nom || 'Nouvelle fiche';
      btn.addEventListener('click', () => changerOnglet(i));
      nav.appendChild(btn);
    });

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
