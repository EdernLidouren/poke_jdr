// Onglet Capacités — sous-onglets Mes capacités et Catalogue

const SOUS_ONGLETS_CAPACITES = [
  { id: 'mes-capacites', label: 'Mes capacités' },
  { id: 'catalogue',     label: 'Catalogue' },
];

export function rendreCapacites(zone, catalogue, save, onSaveChange, availableFilters) {
  let sousOnglet = 'mes-capacites';

  function rendre() {
    const nav = creerNavTertiaire(sousOnglet, (id) => { sousOnglet = id; rendre(); });
    const contenu = document.createElement('div');

    if (sousOnglet === 'catalogue') {
      const movesFilters = (availableFilters && availableFilters.moves) || {};

      // Construire le bloc catalogue d'abord pour obtenir le callback de filtrage
      const { section: sectionCatalogue, appliquerFiltres } =
        construireBlocCatalogueMoves(catalogue, save, movesFilters);

      // Construire le bloc recherche avec référence vers le callback
      const sectionRecherche = construireBlocRecherche(movesFilters, appliquerFiltres);

      // Ordre visuel : recherche d'abord, catalogue ensuite
      contenu.append(sectionRecherche, sectionCatalogue);
    }
    // 'mes-capacites' : vide pour l'instant

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

  for (const { id, label } of SOUS_ONGLETS_CAPACITES) {
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

function construireBlocRecherche(movesFilters, appliquerFiltres) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Rechercher parmi les capacités';
  const btnToggle = creerBtnToggle(false); // développé par défaut
  header.append(h2, btnToggle);

  const contenu = document.createElement('div');
  contenu.className = 'bloc-contenu';
  brancherToggle(btnToggle, contenu);

  // État des filtres
  const filtres = {};
  for (const champ of Object.keys(movesFilters)) filtres[champ] = '';
  filtres.statut = 'tous';

  // Références pour la réinitialisation
  const champRefs = [];

  // Générer les filtres depuis movesFilters
  for (const [champ, config] of Object.entries(movesFilters)) {
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

  // Filtre Statut (hors availableFilters — dépend de la fiche active)
  const ligneStatut = document.createElement('div');
  ligneStatut.className = 'champ-ligne';
  const lblStatut = document.createElement('label');
  lblStatut.textContent = 'Statut';
  const selectStatut = document.createElement('select');
  for (const [val, label] of [
    ['tous',     'Tous'],
    ['apprise',  'Apprise'],
    ['oubliee',  'Oubliée'],
    ['inconnue', 'Inconnue'],
  ]) {
    const opt = document.createElement('option');
    opt.value = val; opt.textContent = label;
    selectStatut.appendChild(opt);
  }
  selectStatut.value = 'tous';
  selectStatut.addEventListener('change', () => {
    filtres.statut = selectStatut.value;
    appliquerFiltres(filtres);
  });
  ligneStatut.append(lblStatut, selectStatut);
  contenu.appendChild(ligneStatut);
  champRefs.push({ reset: () => { selectStatut.value = 'tous'; filtres.statut = 'tous'; } });

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
// Bloc Catalogue des capacités
// =========================================================

function construireBlocCatalogueMoves(catalogue, save, movesFilters) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Catalogue des capacités';
  header.appendChild(h2);

  const liste = document.createElement('div');
  liste.className = 'moves-liste';

  // Map moveId → élément DOM pour accès direct sans querySelector
  const moveElements = new Map();

  for (const move of (catalogue.moves || [])) {
    const entree = document.createElement('div');
    entree.className = 'move-entree';
    entree.dataset.moveId = move.id;

    const ligne1 = document.createElement('div');
    ligne1.className = 'move-entete';
    ligne1.textContent =
      `${move.nom}, ${move.type}, tiers ${move.tiers} : ${move.cible}, ${move.portée}, ${move.utilisation}.`;

    const ligne2 = document.createElement('div');
    ligne2.className = 'move-effets';
    ligne2.textContent = move.effets;

    entree.append(ligne1, ligne2);
    liste.appendChild(entree);
    moveElements.set(move.id, entree);
  }

  // Message état vide (caché par défaut)
  const msgVide = document.createElement('p');
  msgVide.className = 'moves-vide';
  msgVide.textContent = 'Aucune capacité ne correspond à votre recherche.';
  msgVide.hidden = true;
  liste.appendChild(msgVide);

  section.append(header, liste);

  // Callback de filtrage — met à jour la visibilité sans reconstruire le DOM
  function appliquerFiltres(filtres) {
    const currentMoves = save.sheets[save.fiche_active].moves.current_moves;
    let visibleCount = 0;

    for (const move of (catalogue.moves || [])) {
      const el = moveElements.get(move.id);
      if (!el) continue;

      let visible = true;

      // Filtres catalogue : text et enum
      outer: for (const [champ, config] of Object.entries(movesFilters)) {
        const valeur = filtres[champ];
        if (!valeur) continue; // chaîne vide → filtre inactif

        if (config.type === 'text') {
          const moveVal = String(move[champ] ?? '');
          if (!moveVal.toLowerCase().includes(valeur.toLowerCase())) {
            visible = false; break outer;
          }
        } else if (config.type === 'enum') {
          if (move[champ] !== valeur) { visible = false; break outer; }
        }
      }

      // Filtre statut — dépend de la fiche active
      if (visible && filtres.statut !== 'tous') {
        const entreeMove = currentMoves[move.id];
        switch (filtres.statut) {
          case 'apprise':
            if (!entreeMove || entreeMove.is_memorized !== true)  visible = false;
            break;
          case 'oubliee':
            if (!entreeMove || entreeMove.is_memorized !== false) visible = false;
            break;
          case 'inconnue':
            if (entreeMove !== undefined) visible = false;
            break;
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
