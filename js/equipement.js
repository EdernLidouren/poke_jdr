// Onglet Équipement — sous-onglets Mon équipement et Catalogue

const SOUS_ONGLETS_EQUIPEMENT = [
  { id: 'mon-equipement', label: 'Mon équipement' },
  { id: 'catalogue',      label: 'Catalogue' },
];

export function rendreEquipement(zone, catalogue, save, onSaveChange, availableFilters) {
  let sousOnglet = 'mon-equipement';

  function rendre() {
    const nav = creerNavTertiaire(sousOnglet, (id) => { sousOnglet = id; rendre(); });
    const contenu = document.createElement('div');

    if (sousOnglet === 'catalogue') {
      const equipmentFilters = (availableFilters && availableFilters.equipment) || {};

      // Indicateur — mis à jour par les boutons +/−
      const equipmentMapCatalogue = new Map((catalogue.equipment || []).map(e => [e.id, e]));
      const indicateurCatalogue = document.createElement('p');
      mettreAJourIndicateurEquipement(indicateurCatalogue, save, equipmentMapCatalogue);
      const majIndicateurCatalogue = () => mettreAJourIndicateurEquipement(indicateurCatalogue, save, equipmentMapCatalogue);

      // Construire le bloc catalogue d'abord pour obtenir le callback de filtrage
      const { section: sectionCatalogue, appliquerFiltres } =
        construireBlocCatalogueEquipment(catalogue, save, equipmentFilters, onSaveChange, majIndicateurCatalogue);

      // Construire le bloc recherche avec référence vers le callback
      const sectionRecherche = construireBlocRecherche(equipmentFilters, appliquerFiltres);

      // Ordre visuel : indicateur, recherche, catalogue
      contenu.append(indicateurCatalogue, sectionRecherche, sectionCatalogue);
    } else {
      rendreContenuMonEquipement(contenu, catalogue, save, onSaveChange);
    }

    zone.replaceChildren(nav, contenu);
  }

  rendre();
}

// =========================================================
// Navigation tertiaire
// =========================================================

function creerNavTertiaire(actif, onChange) {
  const nav = document.createElement('nav');
  nav.className = 'nav-tertiaire';

  for (const { id, label } of SOUS_ONGLETS_EQUIPEMENT) {
    const btn = document.createElement('button');
    btn.className = 'sous-onglet' + (actif === id ? ' actif' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => onChange(id));
    nav.appendChild(btn);
  }

  return nav;
}

// =========================================================
// Bloc Recherche
// =========================================================

function construireBlocRecherche(equipmentFilters, appliquerFiltres) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Rechercher parmi les équipements';
  const btnToggle = creerBtnToggle(false); // développé par défaut
  header.append(h2, btnToggle);

  const contenu = document.createElement('div');
  contenu.className = 'bloc-contenu';
  brancherToggle(btnToggle, contenu);

  // État des filtres
  const filtres = {};
  for (const champ of Object.keys(equipmentFilters)) filtres[champ] = '';

  // Références pour la réinitialisation
  const champRefs = [];

  // Générer les filtres depuis equipmentFilters
  for (const [champ, config] of Object.entries(equipmentFilters)) {
    // Ignorer les enums sans valeurs (champ inexistant dans le catalogue courant)
    if (config.type === 'enum' && config.values.length === 0) continue;

    const ligne = document.createElement('div');
    ligne.className = 'champ-ligne';

    const lbl = document.createElement('label');
    lbl.textContent = capitaliser(champ);

    if (config.type === 'text') {
      const input = document.createElement('input');
      input.type = 'search';
      input.className = 'filtre-text';
      input.value = '';
      input.addEventListener('input', () => {
        filtres[champ] = input.value;
        appliquerFiltres(filtres);
      });
      ligne.append(lbl, input);
      champRefs.push({ reset: () => { input.value = ''; filtres[champ] = ''; } });

    } else if (config.type === 'enum') {
      const select = document.createElement('select');
      const optTous = document.createElement('option');
      optTous.value = ''; optTous.textContent = 'Tous';
      select.appendChild(optTous);
      for (const val of config.values) {
        const opt = document.createElement('option');
        opt.value = val; opt.textContent = val;
        select.appendChild(opt);
      }
      select.value = '';
      select.addEventListener('change', () => {
        filtres[champ] = select.value;
        appliquerFiltres(filtres);
      });
      ligne.append(lbl, select);
      champRefs.push({ reset: () => { select.value = ''; filtres[champ] = ''; } });
    }

    contenu.appendChild(ligne);
  }

  // Bouton Réinitialiser les filtres
  const btnReset = document.createElement('button');
  btnReset.type = 'button';
  btnReset.className = 'btn-reset-filtres';
  btnReset.textContent = 'Réinitialiser les filtres';
  btnReset.addEventListener('click', () => {
    champRefs.forEach(({ reset }) => reset());
    appliquerFiltres(filtres);
  });
  contenu.appendChild(btnReset);

  section.append(header, contenu);
  return section;
}

// =========================================================
// Sous-onglet Mon équipement
// =========================================================

function mettreAJourIndicateurEquipement(el, save, equipmentMap) {
  const ca  = save.sheets[save.fiche_active].equipment.current_equipment;
  const max = save.sheets[save.fiche_active].equipment.equipment_max;
  let score = 0;
  for (const [id, entree] of Object.entries(ca)) {
    const equipment = equipmentMap.get(id);
    if (equipment) score += (parseInt(equipment.tiers, 10) || 0) * entree.quantity;
  }
  el.textContent = `${score} / ${max} équipements`;
  el.className = 'eq-indicateur ' + (
    score < max   ? 'statut-ok'      :
    score === max ? 'statut-neutre'  :
                   'statut-depasse'
  );
}

function rendreContenuMonEquipement(contenu, catalogue, save, onSaveChange) {
  const equipmentMap = new Map((catalogue.equipment || []).map(e => [e.id, e]));

  // Indicateur
  const indicateur = document.createElement('p');

  function recalculerIndicateur() {
    mettreAJourIndicateurEquipement(indicateur, save, equipmentMap);
  }

  recalculerIndicateur();

  // Bloc "Équipements acquis"
  const section = document.createElement('section');
  section.className = 'bloc';

  const blocHeader = document.createElement('div');
  blocHeader.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Équipements acquis';
  const btnToggle = creerBtnToggle(false); // développé par défaut
  blocHeader.append(h2, btnToggle);

  const corps = document.createElement('div');
  corps.className = 'bloc-contenu';
  brancherToggle(btnToggle, corps);

  const liste = document.createElement('div');
  liste.className = 'eq-liste';
  corps.appendChild(liste);

  function construireListe() {
    liste.replaceChildren();

    const ca = save.sheets[save.fiche_active].equipment.current_equipment;
    const entries = Object.entries(ca)
      .map(([id, entree]) => ({ id, entree, equipment: equipmentMap.get(id) }))
      .filter(({ equipment }) => equipment !== undefined)
      .sort((a, b) => a.equipment.nom.localeCompare(b.equipment.nom));

    if (entries.length === 0) {
      const vide = document.createElement('p');
      vide.className = 'equipment-vide';
      vide.textContent = 'Aucun équipement acquis.';
      liste.appendChild(vide);
      return;
    }

    for (const { id, entree, equipment } of entries) {
      const div = document.createElement('div');
      div.className = 'eq-entree';
      div.dataset.equipmentId = id;

      // Ligne 1 : nom, tiers — [−] qty [+]
      const ligne1 = document.createElement('div');
      ligne1.className = 'eq-entete';

      const spanInfo = document.createElement('span');
      spanInfo.className = 'eq-entete-info';
      spanInfo.textContent = `${equipment.nom}, tiers ${equipment.tiers}`;

      const spanQuantity = document.createElement('span');
      spanQuantity.className = 'ability-quantity';
      spanQuantity.textContent = String(entree.quantity);

      const btnMoins = document.createElement('button');
      btnMoins.type = 'button';
      btnMoins.className = 'btn-ability-qty';
      btnMoins.textContent = '−';
      btnMoins.addEventListener('click', () => {
        const cm = save.sheets[save.fiche_active].equipment.current_equipment;
        if (!(id in cm)) return;
        if (cm[id].quantity === 1) {
          delete cm[id];
          onSaveChange(save);
          div.remove();
          recalculerIndicateur();
          // Afficher le message vide si la liste est maintenant vide
          if (Object.keys(save.sheets[save.fiche_active].equipment.current_equipment).length === 0) {
            construireListe();
          }
        } else {
          cm[id].quantity--;
          onSaveChange(save);
          spanQuantity.textContent = String(cm[id].quantity);
          recalculerIndicateur();
        }
      });

      const btnPlus = document.createElement('button');
      btnPlus.type = 'button';
      btnPlus.className = 'btn-ability-qty';
      btnPlus.textContent = '+';
      btnPlus.addEventListener('click', () => {
        const cm = save.sheets[save.fiche_active].equipment.current_equipment;
        cm[id].quantity++;
        onSaveChange(save);
        spanQuantity.textContent = String(cm[id].quantity);
        recalculerIndicateur();
      });

      ligne1.append(spanInfo, btnMoins, spanQuantity, btnPlus);

      // Ligne 2 : effets
      const ligne2 = document.createElement('div');
      ligne2.className = 'eq-effets';
      ligne2.textContent = equipment.effets;

      // Ligne 3 : toggle notes + textarea (réduit par défaut)
      const ligne3 = document.createElement('div');
      ligne3.className = 'move-notes';

      const btnNotes = document.createElement('button');
      btnNotes.type = 'button';
      btnNotes.className = 'btn-toggle-notes';
      btnNotes.textContent = 'Notes ▼';

      const textarea = document.createElement('textarea');
      textarea.className = 'move-notes-textarea';
      textarea.value = entree.player_notes || '';
      textarea.hidden = true;
      textarea.addEventListener('input', () => {
        const cm = save.sheets[save.fiche_active].equipment.current_equipment;
        if (cm[id]) cm[id].player_notes = textarea.value;
        onSaveChange(save);
      });

      btnNotes.addEventListener('click', () => {
        textarea.hidden = !textarea.hidden;
        btnNotes.textContent = textarea.hidden ? 'Notes ▼' : 'Notes ▲';
      });

      ligne3.append(btnNotes, textarea);

      div.append(ligne1, ligne2, ligne3);
      liste.appendChild(div);
    }
  }

  construireListe();
  section.append(blocHeader, corps);
  contenu.append(indicateur, section);
}

// =========================================================
// Bloc Catalogue des équipements
// =========================================================

function construireBlocCatalogueEquipment(catalogue, save, equipmentFilters, onSaveChange, onIndicateurChange) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Catalogue des équipements';
  header.appendChild(h2);

  const liste = document.createElement('div');
  liste.className = 'equipment-liste';

  // Map equipmentId → élément DOM pour accès direct sans querySelector
  const equipmentElements = new Map();
  // Map equipmentId → span quantity pour mise à jour ciblée
  const quantitySpans = new Map();

  for (const equipment of (catalogue.equipment || [])) {
    const entree = document.createElement('div');
    entree.className = 'equipment-entree';
    entree.dataset.equipmentId = equipment.id;

    // Ligne 1 : entête
    const ligne1 = document.createElement('div');
    ligne1.className = 'equipment-entete';
    ligne1.textContent = `${equipment.nom}, tiers ${equipment.tiers}`;

    // Ligne 2 : effets
    const ligne2 = document.createElement('div');
    ligne2.className = 'equipment-effets';
    ligne2.textContent = equipment.effets;

    // Ligne 3 : − quantity +
    const ligne3 = document.createElement('div');
    ligne3.className = 'equipment-action';

    const spanQuantity = document.createElement('span');
    spanQuantity.className = 'ability-quantity';
    const ca = save.sheets[save.fiche_active].equipment.current_equipment;
    spanQuantity.textContent = ca[equipment.id] ? String(ca[equipment.id].quantity) : '0';
    quantitySpans.set(equipment.id, spanQuantity);

    const btnMoins = document.createElement('button');
    btnMoins.type = 'button';
    btnMoins.className = 'btn-ability-qty';
    btnMoins.textContent = '−';
    btnMoins.addEventListener('click', () => {
      const cm = save.sheets[save.fiche_active].equipment.current_equipment;
      if (!(equipment.id in cm)) return;
      if (cm[equipment.id].quantity === 1) {
        delete cm[equipment.id];
      } else {
        cm[equipment.id].quantity--;
      }
      onSaveChange(save);
      spanQuantity.textContent = cm[equipment.id] ? String(cm[equipment.id].quantity) : '0';
      if (onIndicateurChange) onIndicateurChange();
    });

    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'btn-ability-qty';
    btnPlus.textContent = '+';
    btnPlus.addEventListener('click', () => {
      const cm = save.sheets[save.fiche_active].equipment.current_equipment;
      if (equipment.id in cm) {
        cm[equipment.id].quantity++;
      } else {
        cm[equipment.id] = { quantity: 1, player_notes: '' };
      }
      onSaveChange(save);
      spanQuantity.textContent = String(cm[equipment.id].quantity);
      if (onIndicateurChange) onIndicateurChange();
    });

    ligne3.append(btnMoins, spanQuantity, btnPlus);

    entree.append(ligne1, ligne2, ligne3);
    liste.appendChild(entree);
    equipmentElements.set(equipment.id, entree);
  }

  // Message état vide (caché par défaut)
  const msgVide = document.createElement('p');
  msgVide.className = 'equipment-vide';
  msgVide.textContent = 'Aucun équipement ne correspond à votre recherche.';
  msgVide.hidden = true;
  liste.appendChild(msgVide);

  section.append(header, liste);

  // Callback de filtrage — met à jour la visibilité sans reconstruire le DOM
  function appliquerFiltres(filtres) {
    let visibleCount = 0;

    for (const equipment of (catalogue.equipment || [])) {
      const el = equipmentElements.get(equipment.id);
      if (!el) continue;

      let visible = true;

      // Filtres catalogue : text et enum
      outer: for (const [champ, config] of Object.entries(equipmentFilters)) {
        const valeur = filtres[champ];
        if (!valeur) continue; // chaîne vide → filtre inactif

        if (config.type === 'text') {
          const equipmentVal = String(equipment[champ] ?? '');
          if (!equipmentVal.toLowerCase().includes(valeur.toLowerCase())) {
            visible = false; break outer;
          }
        } else if (config.type === 'enum') {
          if (String(equipment[champ] ?? '') !== valeur) { visible = false; break outer; }
        }
      }

      el.hidden = !visible;
      if (visible) visibleCount++;
    }

    msgVide.hidden = visibleCount > 0;
  }

  return { section, appliquerFiltres };
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

// =========================================================
// Helpers — divers
// =========================================================

function capitaliser(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
