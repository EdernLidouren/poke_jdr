// Onglet Combat

import { renderJaugePV, renderJaugePouvoir, renderValeurCalculee } from './widgets.js';
import { lancerJetCarac, rendreBlocDes } from './dice.js';

const STATUTS_SANS_DECREMENT = ['status_blessure', 'status_regeneration'];

// Contexte enregistré par rendreCombat, utilisé par les fonctions exportées
let _ctx = null;

export function rendreCombat(zone, catalogue, save, onSaveChange) {
  const statusMap = new Map((catalogue.status || []).map(s => [s.id, s]));

  // Référence au rafraîchisseur de l'historique des dés (assignée en fin de fonction)
  let rafraichirHistorique = () => {};

  // =========================================================
  // Bloc "Statuts"
  // =========================================================

  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Statuts';
  const btnToggle = creerBtnToggle(false); // développé par défaut
  header.append(h2, btnToggle);

  const corps = document.createElement('div');
  corps.className = 'bloc-contenu';
  brancherToggle(btnToggle, corps);

  // Zone statuts actifs
  const zoneStatuts = document.createElement('div');
  zoneStatuts.className = 'cf-statuts-actifs';

  // Zone d'ajout (vide pour l'instant)
  const zoneAjout = document.createElement('div');
  zoneAjout.id = 'zone-ajout-statut';

  corps.append(zoneStatuts, zoneAjout);
  section.append(header, corps);

  // Bloc "Commandes"
  const sectionActions = document.createElement('section');
  sectionActions.className = 'bloc';

  const actionsHeader = document.createElement('div');
  actionsHeader.className = 'bloc-header';
  const h2Actions = document.createElement('h2');
  h2Actions.textContent = 'Commandes';
  actionsHeader.appendChild(h2Actions);

  const actionsCorps = document.createElement('div');
  actionsCorps.className = 'cf-actions';

  const btnDebutDeTour = document.createElement('button');
  btnDebutDeTour.type = 'button';
  btnDebutDeTour.className = 'cf-btn-tour';
  btnDebutDeTour.textContent = 'Début de tour';
  btnDebutDeTour.addEventListener('click', executerDebutDeTour);

  const btnFinDeTour = document.createElement('button');
  btnFinDeTour.type = 'button';
  btnFinDeTour.className = 'cf-btn-tour';
  btnFinDeTour.textContent = 'Fin de tour';
  btnFinDeTour.addEventListener('click', executerFinDeTour);

  const btnFinDeCombat = document.createElement('button');
  btnFinDeCombat.type = 'button';
  btnFinDeCombat.className = 'cf-btn-fin-combat';
  btnFinDeCombat.textContent = 'Fin de combat';
  btnFinDeCombat.addEventListener('click', executerFinDeCombat);

  actionsCorps.append(btnDebutDeTour, btnFinDeTour, btnFinDeCombat);
  sectionActions.append(actionsHeader, actionsCorps);

  // Bloc "Caractéristiques"
  const c = save.sheets[save.fiche_active].caracs;

  const sectionCaracs = document.createElement('section');
  sectionCaracs.className = 'bloc';

  const caracsHeader = document.createElement('div');
  caracsHeader.className = 'bloc-header';
  const h2Caracs = document.createElement('h2');
  h2Caracs.textContent = 'Caractéristiques';
  const btnToggleCaracs = creerBtnToggle(false); // développé par défaut
  caracsHeader.append(h2Caracs, btnToggleCaracs);

  const caracsCorps = document.createElement('div');
  caracsCorps.className = 'bloc-contenu';
  brancherToggle(btnToggleCaracs, caracsCorps);

  caracsCorps.appendChild(renderJaugePV(save, onSaveChange).ligne);
  caracsCorps.appendChild(renderJaugePouvoir(save, onSaveChange).ligne);

  caracsCorps.appendChild(renderValeurCalculee('Garde', c.garde + c.garde_mod));
  caracsCorps.appendChild(renderValeurCalculee('Garde spéciale', c.garde_speciale + c.garde_speciale_mod));

  const elAttaque = renderValeurCalculee('Attaque', c.force + c.force_mod + c.attaque_mod);
  const btnDeAttaque = document.createElement('button');
  btnDeAttaque.type = 'button';
  btnDeAttaque.className = 'btn-lancer';
  btnDeAttaque.title = 'Jet d\'attaque';
  btnDeAttaque.textContent = '🎲';
  btnDeAttaque.addEventListener('click', () => {
    const cc = save.sheets[save.fiche_active].caracs;
    lancerJetCarac('Attaque', cc.force + cc.force_mod + cc.attaque_mod);
    rafraichirHistorique();
  });
  elAttaque.appendChild(btnDeAttaque);
  caracsCorps.appendChild(elAttaque);

  const elAttaqueSpec = renderValeurCalculee('Attaque spéciale', c.charisme + c.charisme_mod + c.attaque_speciale_mod);
  const btnDeAttaqueSpec = document.createElement('button');
  btnDeAttaqueSpec.type = 'button';
  btnDeAttaqueSpec.className = 'btn-lancer';
  btnDeAttaqueSpec.title = 'Jet d\'attaque spéciale';
  btnDeAttaqueSpec.textContent = '🎲';
  btnDeAttaqueSpec.addEventListener('click', () => {
    const cc = save.sheets[save.fiche_active].caracs;
    lancerJetCarac('Attaque spéciale', cc.charisme + cc.charisme_mod + cc.attaque_speciale_mod);
    rafraichirHistorique();
  });
  elAttaqueSpec.appendChild(btnDeAttaqueSpec);
  caracsCorps.appendChild(elAttaqueSpec);

  sectionCaracs.append(caracsHeader, caracsCorps);

  // Bloc dés (en bas, partagé avec l'onglet Général via le module dice.js)
  const { section: blocDes, rafraichirHistorique: _refresh } = rendreBlocDes();
  rafraichirHistorique = _refresh;

  zone.append(sectionActions, sectionCaracs, section, blocDes);

  construireListe();
  peuplerZoneAjout();

  // Enregistrer le contexte pour les fonctions exportées
  _ctx = { save, onSaveChange, construireListe, peuplerZoneAjout, nettoyer };

  // =========================================================
  // Construction de la liste des statuts actifs
  // =========================================================

  function construireListe() {
    zoneStatuts.replaceChildren();

    const statuts = save.sheets[save.fiche_active].current_fight.statuts;
    const entries = Object.entries(statuts)
      .map(([id, valeur]) => ({ id, valeur, status: statusMap.get(id) }))
      .filter(({ status }) => status !== undefined);

    if (entries.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'cf-statuts-vide';
      msg.textContent = 'Aucun statut actif.';
      zoneStatuts.appendChild(msg);
      return;
    }

    for (const { id, status } of entries) {
      zoneStatuts.appendChild(creerLigneStatut(id, status));
    }
  }

  function creerLigneStatut(id, status) {
    const div = document.createElement('div');
    div.className = 'cf-statut-ligne';
    div.dataset.statusId = id;

    // Ligne d'entête : [×] [−] [nom] [valeur] [+] [▼]
    const entete = document.createElement('div');
    entete.className = 'cf-statut-entete';

    // Bouton ×
    const btnX = document.createElement('button');
    btnX.type = 'button';
    btnX.className = 'cf-btn-supprimer';
    btnX.textContent = '×';
    btnX.addEventListener('click', () => supprimerStatut(id, div));
    entete.appendChild(btnX);

    // Bouton − (absent pour les statuts sans décrément)
    if (!STATUTS_SANS_DECREMENT.includes(id)) {
      const btnMoins = document.createElement('button');
      btnMoins.type = 'button';
      btnMoins.className = 'btn-ability-qty';
      btnMoins.textContent = '−';
      btnMoins.addEventListener('click', () => {
        const sf = save.sheets[save.fiche_active].current_fight.statuts;
        if (!(id in sf)) return;
        if (sf[id] === 1) {
          supprimerStatut(id, div);
        } else {
          sf[id]--;
          onSaveChange(save);
          spanValeur.textContent = String(sf[id]);
        }
      });
      entete.appendChild(btnMoins);
    }

    // Nom du statut
    const spanNom = document.createElement('span');
    spanNom.className = 'cf-statut-nom';
    spanNom.textContent = status.nom;
    entete.appendChild(spanNom);

    // Valeur
    const spanValeur = document.createElement('span');
    spanValeur.className = 'cf-statut-valeur';
    spanValeur.textContent = String(save.sheets[save.fiche_active].current_fight.statuts[id]);
    entete.appendChild(spanValeur);

    // Bouton +
    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'btn-ability-qty';
    btnPlus.textContent = '+';
    btnPlus.addEventListener('click', () => {
      const sf = save.sheets[save.fiche_active].current_fight.statuts;
      if (!(id in sf)) return;
      if (sf[id] < 99) {
        sf[id]++;
        onSaveChange(save);
        spanValeur.textContent = String(sf[id]);
      }
    });
    entete.appendChild(btnPlus);

    // Bouton développer/réduire effets
    const btnEffets = document.createElement('button');
    btnEffets.type = 'button';
    btnEffets.className = 'cf-btn-effets';
    btnEffets.textContent = '▼';
    entete.appendChild(btnEffets);

    div.appendChild(entete);

    // Bloc effets (réduit par défaut)
    const divEffets = document.createElement('div');
    divEffets.className = 'cf-statut-effets';
    divEffets.textContent = status.effets || '';
    divEffets.hidden = true;

    btnEffets.addEventListener('click', () => {
      divEffets.hidden = !divEffets.hidden;
      btnEffets.textContent = divEffets.hidden ? '▼' : '▲';
    });

    div.appendChild(divEffets);
    return div;
  }

  function supprimerStatut(id, ligneEl) {
    const sf = save.sheets[save.fiche_active].current_fight.statuts;
    delete sf[id];
    onSaveChange(save);
    ligneEl.remove();
    // Afficher le message vide si plus aucun statut actif
    if (Object.keys(save.sheets[save.fiche_active].current_fight.statuts).length === 0) {
      construireListe();
    }
  }

  // =========================================================
  // Zone d'ajout
  // =========================================================

  function peuplerZoneAjout() {
    zoneAjout.replaceChildren();

    // Liste déroulante des statuts
    const selectStatut = document.createElement('select');
    selectStatut.className = 'cf-select-statut';
    for (const status of (catalogue.status || [])) {
      const opt = document.createElement('option');
      opt.value = status.id;
      opt.textContent = status.nom;
      selectStatut.appendChild(opt);
    }

    // Liste déroulante des valeurs 1–99
    const selectValeur = document.createElement('select');
    selectValeur.className = 'cf-select-valeur';
    for (let i = 1; i <= 99; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      selectValeur.appendChild(opt);
    }

    // Bouton Ajouter
    const btnAjouter = document.createElement('button');
    btnAjouter.type = 'button';
    btnAjouter.className = 'btn-ajouter';
    btnAjouter.textContent = 'Ajouter';
    btnAjouter.addEventListener('click', () => {
      const statusId     = selectStatut.value;
      const valeurAjoutee = parseInt(selectValeur.value, 10);
      const status       = statusMap.get(statusId);
      if (!status) return;

      const sf              = save.sheets[save.fiche_active].current_fight.statuts;
      const incompatibilites = status.incompatibilités || [];

      if (statusId in sf) {
        // Cas 1 — statut déjà actif : incrémenter, plafonner à 99
        sf[statusId] = Math.min(99, sf[statusId] + valeurAjoutee);
        onSaveChange(save);
        const ligne = zoneStatuts.querySelector(`[data-status-id="${statusId}"]`);
        if (ligne) {
          ligne.querySelector('.cf-statut-valeur').textContent = String(sf[statusId]);
        }
      } else {
        const incompsActifs = incompatibilites.filter(id => id in sf);

        if (incompsActifs.length > 0) {
          // Cas 2 — incompatibilités actives
          const valeurMax = Math.max(...incompsActifs.map(id => sf[id]));
          for (const id of incompsActifs) {
            sf[id] = Math.max(0, sf[id] - valeurAjoutee);
          }
          nettoyer();
          if (valeurMax < valeurAjoutee) {
            sf[statusId] = valeurAjoutee - valeurMax;
          }
          onSaveChange(save);
          construireListe();
        } else {
          // Cas 3 — aucune incompatibilité active
          sf[statusId] = valeurAjoutee;
          onSaveChange(save);
          construireListe();
        }
      }
    });

    zoneAjout.append(selectStatut, selectValeur, btnAjouter);
  }

  // =========================================================
  // Nettoyage : supprime les entrées ≤ 0 du save et du DOM
  // =========================================================

  function nettoyer() {
    const sf = save.sheets[save.fiche_active].current_fight.statuts;
    for (const id of Object.keys(sf)) {
      if (sf[id] <= 0) {
        delete sf[id];
        const ligneEl = zoneStatuts.querySelector(`[data-status-id="${id}"]`);
        if (ligneEl) ligneEl.remove();
      }
    }
  }
}

// =========================================================
// Fonctions de tour — exportées pour appel depuis d'autres modules
// =========================================================

export function executerDebutDeTour() {
  if (!_ctx) return;
  const { save, onSaveChange, construireListe } = _ctx;
  const sf = save.sheets[save.fiche_active].current_fight.statuts;
  for (const id of Object.keys(sf)) {
    if (!STATUTS_SANS_DECREMENT.includes(id)) {
      sf[id] = Math.max(0, sf[id] - 1);
    }
  }
  // Ne pas nettoyer — les statuts à 0 restent
  onSaveChange(save);
  construireListe();
}

export function executerFinDeTour() {
  if (!_ctx) return;
  const { save, onSaveChange, construireListe, peuplerZoneAjout, nettoyer } = _ctx;
  const sf = save.sheets[save.fiche_active].current_fight.statuts;
  for (const id of Object.keys(sf)) {
    if (STATUTS_SANS_DECREMENT.includes(id)) {
      sf[id] = Math.max(0, sf[id] - 1);
    }
  }
  nettoyer();
  onSaveChange(save);
  construireListe();
  peuplerZoneAjout();
}

export function executerFinDeCombat() {
  if (!_ctx) return;
  const { save, onSaveChange, construireListe, peuplerZoneAjout } = _ctx;
  save.sheets[save.fiche_active].current_fight.statuts = {};
  onSaveChange(save);
  construireListe();
  peuplerZoneAjout();
}

// =========================================================
// Helpers — toggle
// =========================================================

function creerBtnToggle(collapsed = false) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-toggle';
  btn.textContent = collapsed ? '▼' : '▲';
  btn.setAttribute('aria-expanded', String(!collapsed));
  return btn;
}

function brancherToggle(btnToggle, contenu) {
  btnToggle.addEventListener('click', () => {
    const estOuvert = !contenu.hidden;
    contenu.hidden = estOuvert;
    btnToggle.textContent = estOuvert ? '▼' : '▲';
    btnToggle.setAttribute('aria-expanded', String(!estOuvert));
  });
}
