// Onglet Objets — sous-onglets Inventaire et Catalogue

const SOUS_ONGLETS_OBJETS = [
  { id: 'inventaire', label: 'Inventaire' },
  { id: 'catalogue',  label: 'Catalogue' },
];

export function rendreObjets(zone, catalogue, save, onSaveChange, availableFilters) {
  let sousOnglet = 'inventaire';

  function rendre() {
    const nav = creerNavTertiaire(sousOnglet, (id) => { sousOnglet = id; rendre(); });
    const contenu = document.createElement('div');

    if (sousOnglet === 'catalogue') {
      const itemsFilters = (availableFilters && availableFilters.items) || {};

      // Construire le bloc catalogue d'abord pour obtenir le callback de filtrage
      const { section: sectionCatalogue, appliquerFiltres } =
        construireBlocCatalogueItems(catalogue, save, itemsFilters, onSaveChange);

      // Construire le bloc recherche avec référence vers le callback
      const sectionRecherche = construireBlocRecherche(itemsFilters, appliquerFiltres);

      // Ordre visuel : recherche d'abord, catalogue ensuite (pas d'indicateur)
      contenu.append(sectionRecherche, sectionCatalogue);
    } else {
      rendreContenuInventaire(contenu, catalogue, save, onSaveChange);
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

  for (const { id, label } of SOUS_ONGLETS_OBJETS) {
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

function construireBlocRecherche(itemsFilters, appliquerFiltres) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Rechercher parmi les objets';
  const btnToggle = creerBtnToggle(false); // développé par défaut
  header.append(h2, btnToggle);

  const contenu = document.createElement('div');
  contenu.className = 'bloc-contenu';
  brancherToggle(btnToggle, contenu);

  // État des filtres
  const filtres = {};
  for (const champ of Object.keys(itemsFilters)) filtres[champ] = '';

  // Références pour la réinitialisation
  const champRefs = [];

  // Générer les filtres depuis itemsFilters
  for (const [champ, config] of Object.entries(itemsFilters)) {
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
// Sous-onglet Inventaire
// =========================================================

function rendreContenuInventaire(contenu, catalogue, save, onSaveChange) {
  const itemMap = new Map((catalogue.items || []).map(i => [i.id, i]));

  // Bloc "Inventaire"
  const section = document.createElement('section');
  section.className = 'bloc';

  const blocHeader = document.createElement('div');
  blocHeader.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Mon inventaire';
  const btnToggle = creerBtnToggle(false); // développé par défaut
  blocHeader.append(h2, btnToggle);

  const corps = document.createElement('div');
  corps.className = 'bloc-contenu';
  brancherToggle(btnToggle, corps);

  const liste = document.createElement('div');
  liste.className = 'it-liste';
  corps.appendChild(liste);

  function construireListe() {
    liste.replaceChildren();

    const ca = save.sheets[save.fiche_active].items.current_items;
    const entries = Object.entries(ca)
      .map(([id, entree]) => ({ id, entree, item: itemMap.get(id) }))
      .filter(({ item }) => item !== undefined)
      .sort((a, b) => a.item.nom.localeCompare(b.item.nom));

    if (entries.length === 0) {
      const vide = document.createElement('p');
      vide.className = 'items-vide';
      vide.textContent = 'Inventaire vide.';
      liste.appendChild(vide);
      return;
    }

    for (const { id, entree, item } of entries) {
      const div = document.createElement('div');
      div.className = 'it-entree';
      div.dataset.itemId = id;

      // Ligne 1 : nom, tiers — [−] qty [+]
      const ligne1 = document.createElement('div');
      ligne1.className = 'it-entete';

      const spanInfo = document.createElement('span');
      spanInfo.className = 'it-entete-info';
      spanInfo.textContent = `${item.nom}, tiers ${item.tiers}`;

      const spanQuantity = document.createElement('span');
      spanQuantity.className = 'ability-quantity';
      spanQuantity.textContent = String(entree.quantity);

      const btnMoins = document.createElement('button');
      btnMoins.type = 'button';
      btnMoins.className = 'btn-ability-qty';
      btnMoins.textContent = '−';
      btnMoins.addEventListener('click', () => {
        const cm = save.sheets[save.fiche_active].items.current_items;
        if (!(id in cm)) return;
        if (cm[id].quantity === 1) {
          delete cm[id];
          onSaveChange(save);
          div.remove();
          // Afficher le message vide si la liste est maintenant vide
          if (Object.keys(save.sheets[save.fiche_active].items.current_items).length === 0) {
            construireListe();
          }
        } else {
          cm[id].quantity--;
          onSaveChange(save);
          spanQuantity.textContent = String(cm[id].quantity);
        }
      });

      const btnPlus = document.createElement('button');
      btnPlus.type = 'button';
      btnPlus.className = 'btn-ability-qty';
      btnPlus.textContent = '+';
      btnPlus.addEventListener('click', () => {
        const cm = save.sheets[save.fiche_active].items.current_items;
        cm[id].quantity++;
        onSaveChange(save);
        spanQuantity.textContent = String(cm[id].quantity);
      });

      ligne1.append(spanInfo, btnMoins, spanQuantity, btnPlus);

      // Ligne 2 : effets
      const ligne2 = document.createElement('div');
      ligne2.className = 'it-effets';
      ligne2.textContent = item.effets;

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
        const cm = save.sheets[save.fiche_active].items.current_items;
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

  // Bloc "Notes d'inventaire"
  const sectionNotes = document.createElement('section');
  sectionNotes.className = 'bloc';

  const notesHeader = document.createElement('div');
  notesHeader.className = 'bloc-header';
  const h2Notes = document.createElement('h2');
  h2Notes.textContent = 'Notes d\'inventaire';
  const btnToggleNotes = creerBtnToggle(false); // développé par défaut
  notesHeader.append(h2Notes, btnToggleNotes);

  const notesCorps = document.createElement('div');
  notesCorps.className = 'bloc-contenu';
  brancherToggle(btnToggleNotes, notesCorps);

  const textarea = document.createElement('textarea');
  textarea.className = 'it-notes-textarea';
  textarea.value = save.sheets[save.fiche_active].items.notes || '';
  textarea.addEventListener('input', () => {
    save.sheets[save.fiche_active].items.notes = textarea.value;
    onSaveChange(save);
  });

  notesCorps.appendChild(textarea);
  sectionNotes.append(notesHeader, notesCorps);

  contenu.append(section, sectionNotes);
}

// =========================================================
// Bloc Catalogue des objets
// =========================================================

function construireBlocCatalogueItems(catalogue, save, itemsFilters, onSaveChange) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Catalogue des objets';
  header.appendChild(h2);

  const liste = document.createElement('div');
  liste.className = 'items-liste';

  // Map itemId → élément DOM pour accès direct sans querySelector
  const itemElements = new Map();

  for (const item of (catalogue.items || [])) {
    const entree = document.createElement('div');
    entree.className = 'items-entree';
    entree.dataset.itemId = item.id;

    // Ligne 1 : entête
    const ligne1 = document.createElement('div');
    ligne1.className = 'items-entete';
    ligne1.textContent = `${item.nom}, tiers ${item.tiers}`;

    // Ligne 2 : effets
    const ligne2 = document.createElement('div');
    ligne2.className = 'items-effets';
    ligne2.textContent = item.effets;

    // Ligne 3 : − quantity +
    const ligne3 = document.createElement('div');
    ligne3.className = 'items-action';

    const spanQuantity = document.createElement('span');
    spanQuantity.className = 'ability-quantity';
    const ca = save.sheets[save.fiche_active].items.current_items;
    spanQuantity.textContent = ca[item.id] ? String(ca[item.id].quantity) : '0';

    const btnMoins = document.createElement('button');
    btnMoins.type = 'button';
    btnMoins.className = 'btn-ability-qty';
    btnMoins.textContent = '−';
    btnMoins.addEventListener('click', () => {
      const cm = save.sheets[save.fiche_active].items.current_items;
      if (!(item.id in cm)) return;
      if (cm[item.id].quantity === 1) {
        delete cm[item.id];
      } else {
        cm[item.id].quantity--;
      }
      onSaveChange(save);
      spanQuantity.textContent = cm[item.id] ? String(cm[item.id].quantity) : '0';
    });

    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'btn-ability-qty';
    btnPlus.textContent = '+';
    btnPlus.addEventListener('click', () => {
      const cm = save.sheets[save.fiche_active].items.current_items;
      if (item.id in cm) {
        cm[item.id].quantity++;
      } else {
        cm[item.id] = { quantity: 1, player_notes: '' };
      }
      onSaveChange(save);
      spanQuantity.textContent = String(cm[item.id].quantity);
    });

    ligne3.append(btnMoins, spanQuantity, btnPlus);

    entree.append(ligne1, ligne2, ligne3);
    liste.appendChild(entree);
    itemElements.set(item.id, entree);
  }

  // Message état vide (caché par défaut)
  const msgVide = document.createElement('p');
  msgVide.className = 'items-vide';
  msgVide.textContent = 'Aucun objet ne correspond à votre recherche.';
  msgVide.hidden = true;
  liste.appendChild(msgVide);

  section.append(header, liste);

  // Callback de filtrage — met à jour la visibilité sans reconstruire le DOM
  function appliquerFiltres(filtres) {
    let visibleCount = 0;

    for (const item of (catalogue.items || [])) {
      const el = itemElements.get(item.id);
      if (!el) continue;

      let visible = true;

      // Filtres catalogue : text et enum
      outer: for (const [champ, config] of Object.entries(itemsFilters)) {
        const valeur = filtres[champ];
        if (!valeur) continue; // chaîne vide → filtre inactif

        if (config.type === 'text') {
          const itemVal = String(item[champ] ?? '');
          if (!itemVal.toLowerCase().includes(valeur.toLowerCase())) {
            visible = false; break outer;
          }
        } else if (config.type === 'enum') {
          if (String(item[champ] ?? '') !== valeur) { visible = false; break outer; }
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
