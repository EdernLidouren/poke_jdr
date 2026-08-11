// Onglet Talents — sous-onglets Mes talents et Catalogue

const SOUS_ONGLETS_TALENTS = [
  { id: 'mes-talents', label: 'Mes talents' },
  { id: 'catalogue',   label: 'Catalogue' },
];

export function rendreTalents(zone, catalogue, save, onSaveChange, availableFilters) {
  let sousOnglet = 'mes-talents';

  function rendre() {
    const nav = creerNavTertiaire(sousOnglet, (id) => { sousOnglet = id; rendre(); });
    const contenu = document.createElement('div');

    if (sousOnglet === 'catalogue') {
      const abilitiesFilters = (availableFilters && availableFilters.abilities) || {};

      // Indicateur — mis à jour par les boutons +/−
      const abilityMapCatalogue = new Map((catalogue.abilities || []).map(a => [a.id, a]));
      const indicateurCatalogue = document.createElement('p');
      mettreAJourIndicateurTalents(indicateurCatalogue, save, abilityMapCatalogue);
      const majIndicateurCatalogue = () => mettreAJourIndicateurTalents(indicateurCatalogue, save, abilityMapCatalogue);

      // Construire le bloc catalogue d'abord pour obtenir le callback de filtrage
      const { section: sectionCatalogue, appliquerFiltres } =
        construireBlocCatalogueAbilities(catalogue, save, abilitiesFilters, onSaveChange, majIndicateurCatalogue);

      // Construire le bloc recherche avec référence vers le callback
      const sectionRecherche = construireBlocRecherche(abilitiesFilters, appliquerFiltres);

      // Ordre visuel : indicateur, recherche, catalogue
      contenu.append(indicateurCatalogue, sectionRecherche, sectionCatalogue);
    } else {
      rendreContenuMesTalents(contenu, catalogue, save, onSaveChange);
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

  for (const { id, label } of SOUS_ONGLETS_TALENTS) {
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

function construireBlocRecherche(abilitiesFilters, appliquerFiltres) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Rechercher parmi les talents';
  const btnToggle = creerBtnToggle(false); // développé par défaut
  header.append(h2, btnToggle);

  const contenu = document.createElement('div');
  contenu.className = 'bloc-contenu';
  brancherToggle(btnToggle, contenu);

  // État des filtres
  const filtres = {};
  for (const champ of Object.keys(abilitiesFilters)) filtres[champ] = '';

  // Références pour la réinitialisation
  const champRefs = [];

  // Générer les filtres depuis abilitiesFilters
  for (const [champ, config] of Object.entries(abilitiesFilters)) {
    // Ignorer les enums sans valeurs (champ inexistant dans le catalogue courant)
    if (config.type === 'enum' && config.values.length === 0) continue;

    const ligne = document.createElement('div');
    ligne.className = 'champ-ligne';

    const filtreId = 'filtre-tal-' + champ;
    const lbl = document.createElement('label');
    lbl.htmlFor = filtreId;
    lbl.textContent = capitaliser(champ);

    if (config.type === 'text') {
      const input = document.createElement('input');
      input.type = 'search';
      input.id = filtreId;
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
      select.id = filtreId;
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
// Sous-onglet Mes talents
// =========================================================

function mettreAJourIndicateurTalents(el, save, abilityMap) {
  const ca  = save.sheets[save.fiche_active].abilities.current_abilities;
  const max = save.sheets[save.fiche_active].abilities.abilities_max;
  let score = 0;
  for (const [id, entree] of Object.entries(ca)) {
    const ability = abilityMap.get(id);
    if (ability) score += (parseInt(ability.tiers, 10) || 0) * entree.quantity;
  }
  const statut = score < max ? 'statut-ok' : score === max ? 'statut-neutre' : 'statut-depasse';

  el.className = 'mt-indicateur ' + statut;

  const icone = document.createElement('span');
  icone.className = 'indicateur-icone';
  if (statut === 'statut-depasse') {
    icone.textContent = '×';
    icone.setAttribute('aria-label', 'Limite dépassée');
  } else {
    icone.textContent = '✓';
    icone.setAttribute('aria-hidden', 'true');
  }

  el.replaceChildren(icone, `${score} / ${max} talents`);
}

function rendreContenuMesTalents(contenu, catalogue, save, onSaveChange) {
  const abilityMap = new Map((catalogue.abilities || []).map(a => [a.id, a]));

  // Indicateur
  const indicateur = document.createElement('p');

  function recalculerIndicateur() {
    mettreAJourIndicateurTalents(indicateur, save, abilityMap);
  }

  recalculerIndicateur();

  const fiche = save.sheets[save.fiche_active];
  const divMax = document.createElement('div');
  divMax.className = 'max-controle';
  const lblMax = document.createElement('span');
  lblMax.className = 'max-controle-label';
  lblMax.textContent = 'Maximum';
  const spanMax = document.createElement('span');
  spanMax.className = 'max-controle-valeur';
  spanMax.textContent = String(fiche.abilities.abilities_max);
  const btnMaxMoins = document.createElement('button');
  btnMaxMoins.type = 'button';
  btnMaxMoins.className = 'btn-stepper';
  btnMaxMoins.textContent = '−';
  btnMaxMoins.setAttribute('aria-label', 'Diminuer le maximum de talents');
  const btnMaxPlus = document.createElement('button');
  btnMaxPlus.type = 'button';
  btnMaxPlus.className = 'btn-stepper';
  btnMaxPlus.textContent = '+';
  btnMaxPlus.setAttribute('aria-label', 'Augmenter le maximum de talents');
  btnMaxMoins.addEventListener('click', () => {
    if (fiche.abilities.abilities_max <= 1) return;
    fiche.abilities.abilities_max--;
    spanMax.textContent = String(fiche.abilities.abilities_max);
    onSaveChange(save);
    mettreAJourIndicateurTalents(indicateur, save, abilityMap);
  });
  btnMaxPlus.addEventListener('click', () => {
    if (fiche.abilities.abilities_max >= 99) return;
    fiche.abilities.abilities_max++;
    spanMax.textContent = String(fiche.abilities.abilities_max);
    onSaveChange(save);
    mettreAJourIndicateurTalents(indicateur, save, abilityMap);
  });
  divMax.append(lblMax, btnMaxMoins, spanMax, btnMaxPlus);

  // Bloc "Talents appris"
  const section = document.createElement('section');
  section.className = 'bloc';

  const blocHeader = document.createElement('div');
  blocHeader.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Talents appris';
  const btnToggle = creerBtnToggle(false); // développé par défaut
  blocHeader.append(h2, btnToggle);

  const corps = document.createElement('div');
  corps.className = 'bloc-contenu';
  brancherToggle(btnToggle, corps);

  const liste = document.createElement('div');
  liste.className = 'mt-liste';
  corps.appendChild(liste);

  function construireListe() {
    liste.replaceChildren();

    const ca = save.sheets[save.fiche_active].abilities.current_abilities;
    const entries = Object.entries(ca)
      .map(([id, entree]) => ({ id, entree, ability: abilityMap.get(id) }))
      .filter(({ ability }) => ability !== undefined)
      .sort((a, b) => a.ability.nom.localeCompare(b.ability.nom));

    if (entries.length === 0) {
      const vide = document.createElement('p');
      vide.className = 'abilities-vide';
      vide.textContent = 'Aucun talent acquis.';
      liste.appendChild(vide);
      return;
    }

    for (const { id, entree, ability } of entries) {
      const div = document.createElement('div');
      div.className = 'mt-entree cell-entree';
      div.dataset.abilityId = id;

      const corps = document.createElement('div');
      corps.className = 'cell-corps';

      // Ligne 1 : nom, tiers
      const ligne1 = document.createElement('div');
      ligne1.className = 'mt-entete';

      const spanInfo = document.createElement('span');
      spanInfo.className = 'mt-entete-info';
      spanInfo.textContent = `${ability.nom}, tiers ${ability.tiers}`;

      ligne1.append(spanInfo);

      // Ligne 2 : effets
      const ligne2 = document.createElement('div');
      ligne2.className = 'mt-effets';
      ligne2.textContent = ability.effets;

      // Ligne 3 : toggle notes + textarea (réduit par défaut)
      const ligne3 = document.createElement('div');
      ligne3.className = 'move-notes';

      const btnNotes = document.createElement('button');
      btnNotes.type = 'button';
      btnNotes.className = 'btn-toggle-notes';
      btnNotes.textContent = 'Notes ▼';

      const textarea = document.createElement('textarea');
      textarea.className = 'move-notes-textarea';
      textarea.setAttribute('aria-label', `Notes personnelles : ${ability.nom}`);
      textarea.value = entree.player_notes || '';
      textarea.hidden = true;
      textarea.addEventListener('input', () => {
        const cm = save.sheets[save.fiche_active].abilities.current_abilities;
        if (cm[id]) cm[id].player_notes = textarea.value;
        onSaveChange(save);
      });

      btnNotes.addEventListener('click', () => {
        textarea.hidden = !textarea.hidden;
        btnNotes.textContent = textarea.hidden ? 'Notes ▼' : 'Notes ▲';
      });

      ligne3.append(btnNotes, textarea);
      corps.append(ligne1, ligne2, ligne3);

      // Colonne action — [−] qty [+]
      const spanQuantity = document.createElement('span');
      spanQuantity.className = 'ability-quantity';
      spanQuantity.textContent = String(entree.quantity);

      const btnMoins = document.createElement('button');
      btnMoins.type = 'button';
      btnMoins.className = 'btn-ability-qty';
      btnMoins.textContent = '−';
      btnMoins.addEventListener('click', () => {
        const cm = save.sheets[save.fiche_active].abilities.current_abilities;
        if (!(id in cm)) return;
        if (cm[id].quantity === 1) {
          delete cm[id];
          onSaveChange(save);
          div.remove();
          recalculerIndicateur();
          // Afficher le message vide si la liste est maintenant vide
          if (Object.keys(save.sheets[save.fiche_active].abilities.current_abilities).length === 0) {
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
        const cm = save.sheets[save.fiche_active].abilities.current_abilities;
        cm[id].quantity++;
        onSaveChange(save);
        spanQuantity.textContent = String(cm[id].quantity);
        recalculerIndicateur();
      });

      const action = document.createElement('div');
      action.className = 'cell-action';
      action.append(btnMoins, spanQuantity, btnPlus);

      div.append(corps, action);
      liste.appendChild(div);
    }
  }

  construireListe();
  section.append(blocHeader, corps);
  contenu.append(indicateur, divMax, section);
}

// =========================================================
// Bloc Catalogue des talents
// =========================================================

function construireBlocCatalogueAbilities(catalogue, save, abilitiesFilters, onSaveChange, onIndicateurChange) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Catalogue des talents';
  header.appendChild(h2);

  const liste = document.createElement('div');
  liste.className = 'abilities-liste';

  // Map abilityId → élément DOM pour accès direct sans querySelector
  const abilityElements = new Map();
  // Map abilityId → span quantity pour mise à jour ciblée
  const quantitySpans = new Map();

  for (const ability of (catalogue.abilities || [])) {
    const entree = document.createElement('div');
    entree.className = 'ability-entree cell-entree';
    entree.dataset.abilityId = ability.id;

    const corps = document.createElement('div');
    corps.className = 'cell-corps';

    // Ligne 1 : entête — nom
    const ligne1 = document.createElement('div');
    ligne1.className = 'ability-entete';

    const spanNom = document.createElement('span');
    spanNom.className = 'ability-entete-nom';
    spanNom.textContent = `${ability.nom}, tiers ${ability.tiers}`;

    ligne1.append(spanNom);

    // Ligne 2 : effets
    const ligne2 = document.createElement('div');
    ligne2.className = 'ability-effets';
    ligne2.textContent = ability.effets;

    corps.append(ligne1, ligne2);

    // Colonne action — [−] qty [+]
    const spanQuantity = document.createElement('span');
    spanQuantity.className = 'ability-quantity';
    const ca = save.sheets[save.fiche_active].abilities.current_abilities;
    spanQuantity.textContent = ca[ability.id] ? String(ca[ability.id].quantity) : '0';
    quantitySpans.set(ability.id, spanQuantity);

    const btnMoins = document.createElement('button');
    btnMoins.type = 'button';
    btnMoins.className = 'btn-ability-qty';
    btnMoins.textContent = '−';
    btnMoins.addEventListener('click', () => {
      const cm = save.sheets[save.fiche_active].abilities.current_abilities;
      if (!(ability.id in cm)) return;
      if (cm[ability.id].quantity === 1) {
        delete cm[ability.id];
      } else {
        cm[ability.id].quantity--;
      }
      onSaveChange(save);
      spanQuantity.textContent = cm[ability.id] ? String(cm[ability.id].quantity) : '0';
      if (onIndicateurChange) onIndicateurChange();
    });

    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'btn-ability-qty';
    btnPlus.textContent = '+';
    btnPlus.addEventListener('click', () => {
      const cm = save.sheets[save.fiche_active].abilities.current_abilities;
      if (ability.id in cm) {
        cm[ability.id].quantity++;
      } else {
        cm[ability.id] = { quantity: 1, player_notes: '' };
      }
      onSaveChange(save);
      spanQuantity.textContent = String(cm[ability.id].quantity);
      if (onIndicateurChange) onIndicateurChange();
    });

    const action = document.createElement('div');
    action.className = 'cell-action';
    action.append(btnMoins, spanQuantity, btnPlus);

    entree.append(corps, action);
    liste.appendChild(entree);
    abilityElements.set(ability.id, entree);
  }

  // Message état vide (caché par défaut)
  const msgVide = document.createElement('p');
  msgVide.className = 'abilities-vide';
  msgVide.textContent = 'Aucun talent ne correspond à votre recherche.';
  msgVide.hidden = true;
  liste.appendChild(msgVide);

  section.append(header, liste);

  // Callback de filtrage — met à jour la visibilité sans reconstruire le DOM
  function appliquerFiltres(filtres) {
    let visibleCount = 0;

    for (const ability of (catalogue.abilities || [])) {
      const el = abilityElements.get(ability.id);
      if (!el) continue;

      let visible = true;

      // Filtres catalogue : text et enum
      outer: for (const [champ, config] of Object.entries(abilitiesFilters)) {
        const valeur = filtres[champ];
        if (!valeur) continue; // chaîne vide → filtre inactif

        if (config.type === 'text') {
          const abilityVal = String(ability[champ] ?? '');
          if (!abilityVal.toLowerCase().includes(valeur.toLowerCase())) {
            visible = false; break outer;
          }
        } else if (config.type === 'enum') {
          if (String(ability[champ] ?? '') !== valeur) { visible = false; break outer; }
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
