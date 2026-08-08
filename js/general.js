// Onglet Général — blocs Identité et Caractéristiques

import { renderJaugePV, renderJaugePouvoir } from './widgets.js';
import { executerFinDeCombat } from './combat.js';
import { lancerJetCarac, lancerJetCompetence, rendreBlocDes, CARACS_PRIMAIRES } from './dice.js';
import { lireAffichageCompetences } from './affichage_competences.js';

export function rendreGeneral(zone, catalogue, save, onSaveChange) {
  const ficheIndex = save.fiche_active;
  const caracs = save.sheets[ficheIndex].caracs;
  const { section: blocDes, rafraichirHistorique } = rendreBlocDes();
  zone.replaceChildren(
    construireBlocIdentite(catalogue, caracs, ficheIndex, save, onSaveChange),
    construireBlocCaracteristiques(caracs, save, onSaveChange, rafraichirHistorique),
    construireBlocCompetences(catalogue, save, onSaveChange, rafraichirHistorique),
    blocDes,
  );
}

// =========================================================
// Bloc Identité
// =========================================================

function construireBlocIdentite(catalogue, caracs, ficheIndex, save, onSaveChange) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Identité';
  const btnToggle = creerBtnToggle();
  header.append(h2, btnToggle);

  const contenu = document.createElement('div');
  contenu.className = 'bloc-contenu';
  brancherToggle(btnToggle, contenu);

  contenu.appendChild(creerChampTexte('Nom', caracs.nom, 30, (val) => {
    caracs.nom = val;
    onSaveChange(save);
    mettreAJourLabelOnglet(ficheIndex, val);
  }));

  contenu.appendChild(creerChampTexte('Espèce', caracs.espèce, 30, (val) => {
    caracs.espèce = val;
    onSaveChange(save);
  }));

  let refInputExp = null;

  const { conteneur: ligneNiveau } = creerChampNombre(
    'Niveau', caracs.niveau, 1, 20,
    (val) => {
      caracs.niveau = val;
      if (refInputExp) {
        refInputExp.max = val + 1;
        if (Number(refInputExp.value) > val + 1) {
          refInputExp.value = val + 1;
          caracs.expérience = val + 1;
        }
      }
      onSaveChange(save);
    }
  );

  const { conteneur: ligneExp, input: inputExp } = creerChampNombre(
    'Expérience', caracs.expérience, 0, caracs.niveau + 1,
    (val) => { caracs.expérience = val; onSaveChange(save); }
  );
  refInputExp = inputExp;

  contenu.append(ligneNiveau, ligneExp);

  const typesDisponibles = catalogue.types || [];
  contenu.appendChild(creerChampSelect('Type 1', caracs.type_1, typesDisponibles, (val) => {
    caracs.type_1 = val; onSaveChange(save);
  }));
  contenu.appendChild(creerChampSelect('Type 2', caracs.type_2, typesDisponibles, (val) => {
    caracs.type_2 = val; onSaveChange(save);
  }));
  contenu.appendChild(creerChampSelect('Type 3', caracs.type_3, typesDisponibles, (val) => {
    caracs.type_3 = val; onSaveChange(save);
  }));

  const { btnMoins: btnPkMoins, input: inputPk, btnPlus: btnPkPlus } = creerStepperElements(
    caracs.pokedollar, 0, 100000000,
    (val) => { caracs.pokedollar = val; onSaveChange(save); }
  );
  btnPkMoins.setAttribute('aria-label', 'Diminuer les Poké dollars');
  btnPkPlus.setAttribute('aria-label', 'Augmenter les Poké dollars');
  const lignePokedollar = document.createElement('div');
  lignePokedollar.className = 'stat-ligne';
  const lblPk = document.createElement('span');
  lblPk.className = 'stat-label';
  lblPk.textContent = 'Poké dollars';
  const controlesPk = document.createElement('div');
  controlesPk.className = 'stat-controles';
  controlesPk.append(btnPkMoins, inputPk, btnPkPlus);
  lignePokedollar.append(lblPk, controlesPk);
  contenu.appendChild(lignePokedollar);

  section.append(header, contenu);
  return section;
}

// =========================================================
// Bloc Caractéristiques
// =========================================================

function construireBlocCaracteristiques(caracs, save, onSaveChange, rafraichirHistorique) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Caractéristiques';
  const btnToggle = creerBtnToggle();
  header.append(h2, btnToggle);

  const contenu = document.createElement('div');
  contenu.className = 'bloc-contenu';
  brancherToggle(btnToggle, contenu);

  // --- Références croisées ---
  let refGardeTotale      = null;
  let refGardeSpecTotale  = null;
  let refAttaque          = null;
  let refAttaqueSpec      = null;
  const refTotaux = {};

  function calcGarde()         { return 10 + Math.floor((caracs.constitution + caracs.agilité) / 2); }
  function calcGardeSpec()     { return 10 + Math.floor((caracs.esprit + caracs.agilité) / 2); }
  function calcAttaque()       { return caracs.force; }
  function calcAttaqueSpec()   { return caracs.charisme; }

  function mettreAJourGardes() {
    if (refGardeTotale)     refGardeTotale.textContent     = calcGarde();
    if (refGardeSpecTotale) refGardeSpecTotale.textContent = calcGardeSpec();
  }

  function mettreAJourAttaques() {
    if (refAttaque)     refAttaque.textContent     = calcAttaque();
    if (refAttaqueSpec) refAttaqueSpec.textContent = calcAttaqueSpec();
  }

  // ---- Sous-bloc secondaires (en premier) ----
  const enteteSecondaires = document.createElement('div');
  enteteSecondaires.className = 'sous-bloc-entete';
  enteteSecondaires.appendChild(creerTitreSousBloc('Caractéristiques secondaires'));

  const btnReposCourt = document.createElement('button');
  btnReposCourt.type = 'button';
  btnReposCourt.className = 'btn-repos btn-repos-court';
  btnReposCourt.textContent = 'Repos court';
  btnReposCourt.setAttribute('aria-label', 'Repos court — récupérer la moitié des PV et du Pouvoir');

  const btnReposLong = document.createElement('button');
  btnReposLong.type = 'button';
  btnReposLong.className = 'btn-repos btn-repos-long';
  btnReposLong.textContent = 'Repos long';
  btnReposLong.setAttribute('aria-label', 'Repos long — remettre PV et Pouvoir au maximum');

  enteteSecondaires.append(btnReposCourt, btnReposLong);
  contenu.appendChild(enteteSecondaires);

  const { ligne: lignePV, rafraichir: rafraichirPV } = renderJaugePV(save, onSaveChange);
  const { ligne: lignePouvoir, rafraichir: rafraichirPouvoir } = renderJaugePouvoir(save, onSaveChange);
  contenu.appendChild(lignePV);
  contenu.appendChild(lignePouvoir);

  btnReposCourt.addEventListener('click', () => {
    const c = save.sheets[save.fiche_active].caracs;
    c.pv      = Math.min(c.pv_max,      c.pv      + Math.floor(c.pv_max      / 2));
    c.pouvoir = Math.min(c.pouvoir_max, c.pouvoir + Math.floor(c.pouvoir_max / 2));
    // TODO: annoncer le repos au lecteur d'écran (ARIA live) — ex. "Repos court : PV X/Y, Pouvoir X/Y"
    onSaveChange(save);
    rafraichirPV();
    rafraichirPouvoir();
    executerFinDeCombat();
  });

  btnReposLong.addEventListener('click', () => {
    const c = save.sheets[save.fiche_active].caracs;
    c.pv             = c.pv_max;
    c.pouvoir        = c.pouvoir_max;
    c.pv_temporaires = 0;
    // TODO: annoncer le repos au lecteur d'écran (ARIA live) — ex. "Repos long : PV X/Y, Pouvoir X/Y"
    onSaveChange(save);
    rafraichirPV();
    rafraichirPouvoir();
    executerFinDeCombat();
  });

  // Garde
  const { ligne: ligneGarde, spanTotal: spanGardeTotale } = creerLigneReadOnly('Garde', calcGarde());
  refGardeTotale = spanGardeTotale;
  contenu.appendChild(ligneGarde);

  // Garde spéciale
  const { ligne: ligneGardeSpec, spanTotal: spanGardeSpecTotale } = creerLigneReadOnly('Garde spéciale', calcGardeSpec());
  refGardeSpecTotale = spanGardeSpecTotale;
  contenu.appendChild(ligneGardeSpec);

  // Attaque
  const { ligne: ligneAttaque, spanTotal: spanAttaqueTotale } = creerLigneReadOnly('Attaque', calcAttaque());
  refAttaque = spanAttaqueTotale;
  contenu.appendChild(ligneAttaque);

  // Attaque spéciale
  const { ligne: ligneAttaqueSpec, spanTotal: spanAttaqueSpecTotale } = creerLigneReadOnly('Attaque spéciale', calcAttaqueSpec());
  refAttaqueSpec = spanAttaqueSpecTotale;
  contenu.appendChild(ligneAttaqueSpec);

  // --- Séparateur ---
  contenu.appendChild(creerSeparateur());

  // ---- Sous-bloc primaires (en second) ----
  contenu.appendChild(creerTitreSousBloc('Caractéristiques primaires'));

  const STATS = [
    { label: 'Force',        cle: 'force',        affecteGarde: false },
    { label: 'Constitution', cle: 'constitution',  affecteGarde: true  },
    { label: 'Charisme',     cle: 'charisme',      affecteGarde: false },
    { label: 'Esprit',       cle: 'esprit',        affecteGarde: true  },
    { label: 'Agilité',      cle: 'agilité',       affecteGarde: true  },
  ];

  for (const { label, cle, affecteGarde } of STATS) {
    const { ligne, spanTotal, controles } = creerLigneStat(
      label,
      caracs[cle],
      0, 999,
      (val) => {
        caracs[cle] = val;
        refTotaux[cle].textContent = caracs[cle];
        if (affecteGarde) mettreAJourGardes();
        mettreAJourAttaques();
        onSaveChange(save);
      }
    );
    refTotaux[cle] = spanTotal;

    // Bouton dé contextuel
    const btnDeStat = document.createElement('button');
    btnDeStat.type = 'button';
    btnDeStat.className = 'btn-lancer';
    btnDeStat.title = `Jet de ${label}`;
    btnDeStat.textContent = '🎲';
    btnDeStat.addEventListener('click', () => {
      lancerJetCarac(label, caracs[cle]);
      rafraichirHistorique();
    });
    controles.appendChild(btnDeStat);

    contenu.appendChild(ligne);
  }

  section.append(header, contenu);
  return section;
}

// =========================================================
// Bloc Compétences
// =========================================================

function construireBlocCompetences(catalogue, save, onSaveChange, rafraichirHistorique) {
  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Compétences';
  const btnToggle = creerBtnToggle();
  header.append(h2, btnToggle);

  const contenu = document.createElement('div');
  contenu.className = 'bloc-contenu';
  brancherToggle(btnToggle, contenu);

  function rebuilder() {
    contenu.replaceChildren();
    if (lireAffichageCompetences() === 'compact') {
      remplirCompetencesCompact(catalogue, save, onSaveChange, rafraichirHistorique, contenu);
    } else {
      remplirCompetencesComplet(catalogue, save, onSaveChange, rafraichirHistorique, contenu);
    }
  }

  rebuilder();
  document.addEventListener('affichage-competences-change', () => {
    if (section.isConnected) rebuilder();
  });

  section.append(header, contenu);
  return section;
}

function remplirCompetencesComplet(catalogue, save, onSaveChange, rafraichirHistorique, contenu) {
  const skills = save.sheets[save.fiche_active].skills;

  for (const nom of (catalogue.skills || [])) {
    if (skills[nom] === undefined) skills[nom] = 0;

    const ligne = document.createElement('div');
    ligne.className = 'stat-ligne';

    const lbl = document.createElement('span');
    lbl.className = 'stat-label';
    lbl.textContent = nom;

    const spanTotal = document.createElement('span');
    spanTotal.className = 'stat-total';
    spanTotal.textContent = calcTotalSkill(skills[nom]);

    const groupeBase = creerStatGroupe('val', skills[nom], -3, 3, (val) => {
      skills[nom] = val;
      spanTotal.textContent = calcTotalSkill(skills[nom]);
      onSaveChange(save);
    });

    // Bouton dé contextuel + zone inline carac
    const btnDe = document.createElement('button');
    btnDe.type = 'button';
    btnDe.className = 'btn-lancer';
    btnDe.title = `Jet de ${nom}`;
    btnDe.textContent = '🎲';

    const zoneInline = document.createElement('div');
    zoneInline.className = 'des-inline-zone';
    zoneInline.hidden = true;

    const selectCarac = document.createElement('select');
    selectCarac.className = 'des-select-carac';
    for (const c of CARACS_PRIMAIRES) {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
      selectCarac.appendChild(opt);
    }
    const caracDefaut = catalogue.competence_carac_defaut?.[nom];
    if (caracDefaut) selectCarac.value = caracDefaut;

    const btnLancerSkill = document.createElement('button');
    btnLancerSkill.type = 'button';
    btnLancerSkill.className = 'btn-lancer';
    btnLancerSkill.textContent = 'Lancer';
    btnLancerSkill.addEventListener('click', () => {
      const nomCarac = selectCarac.value;
      const c = save.sheets[save.fiche_active].caracs;
      const valCarac = c[nomCarac];
      lancerJetCompetence(nom, calcTotalSkill(skills[nom]), nomCarac, valCarac);
      rafraichirHistorique();
      zoneInline.hidden = true;
      btnDe.textContent = '🎲';
    });

    zoneInline.append(selectCarac, btnLancerSkill);

    btnDe.addEventListener('click', () => {
      const wasHidden = zoneInline.hidden;
      zoneInline.hidden = !wasHidden;
      btnDe.textContent = wasHidden ? '▲' : '🎲';
    });

    const controles = document.createElement('div');
    controles.className = 'stat-controles';
    controles.append(groupeBase, btnDe);

    ligne.append(lbl, spanTotal, controles);
    contenu.appendChild(ligne);
    contenu.appendChild(zoneInline);
  }
}

function remplirCompetencesCompact(catalogue, save, onSaveChange, rafraichirHistorique, contenu) {
  const skills = save.sheets[save.fiche_active].skills;
  const skillList = catalogue.skills || [];
  if (skillList.length === 0) return;

  for (const nom of skillList) {
    if (skills[nom] === undefined) skills[nom] = 0;
  }

  const ligne = document.createElement('div');
  ligne.className = 'comp-compact';

  // Sélecteur de compétence
  const labelSkill = document.createElement('label');
  labelSkill.htmlFor = 'comp-select-skill';
  labelSkill.textContent = 'Compétence';

  const selectSkill = document.createElement('select');
  selectSkill.id = 'comp-select-skill';
  selectSkill.className = 'des-select';
  for (const nom of skillList) {
    const opt = document.createElement('option');
    opt.value = nom;
    opt.textContent = nom;
    selectSkill.appendChild(opt);
  }

  // Total affiché
  const spanTotal = document.createElement('span');
  spanTotal.className = 'stat-total';

  // Stepper base (-3 à 3)
  const lblBase = document.createElement('span');
  lblBase.className = 'stat-groupe-label';
  lblBase.textContent = 'base';

  const { btnMoins: btnBaseMoins, input: inputBase, btnPlus: btnBasePlus } = creerStepperElements(
    0, -3, 3,
    (val) => {
      const nom = selectSkill.value;
      skills[nom] = val;
      spanTotal.textContent = calcTotalSkill(skills[nom]);
      onSaveChange(save);
    }
  );
  btnBaseMoins.setAttribute('aria-label', 'Diminuer la valeur de la compétence');
  btnBasePlus.setAttribute('aria-label', 'Augmenter la valeur de la compétence');

  // Sélecteur de carac pour le jet
  const selectCarac = document.createElement('select');
  selectCarac.className = 'des-select-carac';
  selectCarac.setAttribute('aria-label', 'Caractéristique pour le jet de compétence');
  for (const c of CARACS_PRIMAIRES) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    selectCarac.appendChild(opt);
  }

  // Bouton Lancer — même logique que le mode complet
  const btnLancer = document.createElement('button');
  btnLancer.type = 'button';
  btnLancer.className = 'btn-lancer';
  btnLancer.textContent = 'Lancer';
  btnLancer.addEventListener('click', () => {
    const nom = selectSkill.value;
    const nomCarac = selectCarac.value;
    const c = save.sheets[save.fiche_active].caracs;
    const valCarac = c[nomCarac];
    lancerJetCompetence(nom, calcTotalSkill(skills[nom]), nomCarac, valCarac);
    rafraichirHistorique();
  });

  // Mise à jour de l'affichage quand la compétence change
  function mettreAJour(nom) {
    inputBase.value = String(skills[nom]);
    spanTotal.textContent = calcTotalSkill(skills[nom]);
    const defaut = catalogue.competence_carac_defaut?.[nom];
    if (defaut && CARACS_PRIMAIRES.includes(defaut)) selectCarac.value = defaut;
  }

  selectSkill.addEventListener('change', () => mettreAJour(selectSkill.value));
  mettreAJour(skillList[0]);

  ligne.append(
    labelSkill, selectSkill,
    spanTotal,
    lblBase, btnBaseMoins, inputBase, btnBasePlus,
    selectCarac, btnLancer,
  );
  contenu.appendChild(ligne);
}

function calcTotalSkill(valeur) {
  return Math.min(3, Math.max(-3, valeur));
}

// =========================================================
// Helpers partagés — blocs
// =========================================================

function creerBtnToggle() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-toggle';
  btn.textContent = '▲';
  btn.setAttribute('aria-expanded', 'true');
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

function creerTitreSousBloc(texte) {
  const h3 = document.createElement('h3');
  h3.className = 'sous-bloc-titre';
  h3.textContent = texte;
  return h3;
}

function creerSeparateur() {
  const div = document.createElement('div');
  div.className = 'sous-bloc-sep';
  return div;
}

// =========================================================
// Helpers partagés — éléments stepper
// =========================================================

function creerStepperElements(valeur, min, max, onChange) {
  const btnMoins = document.createElement('button');
  btnMoins.type = 'button'; btnMoins.className = 'btn-stepper'; btnMoins.textContent = '−';

  const input = document.createElement('input');
  input.type = 'number'; input.min = min; input.max = max; input.value = valeur;

  const btnPlus = document.createElement('button');
  btnPlus.type = 'button'; btnPlus.className = 'btn-stepper'; btnPlus.textContent = '+';

  function clampEtNotifier(brut) {
    const val = Math.round(Number(brut));
    if (isNaN(val)) return;
    const clamped = Math.max(Number(input.min), Math.min(Number(input.max), val));
    input.value = clamped;
    onChange(clamped);
  }

  btnMoins.addEventListener('click', () => clampEtNotifier(Number(input.value) - 1));
  btnPlus.addEventListener('click',  () => clampEtNotifier(Number(input.value) + 1));
  input.addEventListener('change',   () => clampEtNotifier(input.value));

  return { btnMoins, input, btnPlus };
}

// =========================================================
// Helpers partagés — champs simples (champ-ligne)
// =========================================================

function creerChampTexte(labelTexte, valeur, maxlength, onChange) {
  const ligne = document.createElement('div');
  ligne.className = 'champ-ligne';
  const lbl = document.createElement('label');
  lbl.textContent = labelTexte;
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = maxlength;
  input.value = valeur;
  input.addEventListener('input', () => onChange(input.value));
  ligne.append(lbl, input);
  return ligne;
}

function creerChampNombre(labelTexte, valeur, min, max, onChange) {
  const ligne = document.createElement('div');
  ligne.className = 'champ-ligne';
  const lbl = document.createElement('label');
  lbl.textContent = labelTexte;
  const { btnMoins, input, btnPlus } = creerStepperElements(valeur, min, max, onChange);
  ligne.append(lbl, btnMoins, input, btnPlus);
  return { conteneur: ligne, input };
}

// Deux groupes label+stepper sur la même ligne champ-ligne
function creerChampNombreDouble(
  label1, val1, min1, max1, onChange1,
  label2, val2, min2, max2, onChange2
) {
  const ligne = document.createElement('div');
  ligne.className = 'champ-ligne';

  const lbl1 = document.createElement('label');
  lbl1.textContent = label1;
  const { btnMoins: bm1, input: inp1, btnPlus: bp1 } = creerStepperElements(val1, min1, max1, onChange1);

  const lbl2 = document.createElement('label');
  lbl2.className = 'champ-label-droite';
  lbl2.textContent = label2;
  const { btnMoins: bm2, input: inp2, btnPlus: bp2 } = creerStepperElements(val2, min2, max2, onChange2);

  ligne.append(lbl1, bm1, inp1, bp1, lbl2, bm2, inp2, bp2);
  return { conteneur: ligne, input1: inp1, input2: inp2 };
}

function creerChampSelect(labelTexte, valeur, types, onChange) {
  const ligne = document.createElement('div');
  ligne.className = 'champ-ligne';
  const lbl = document.createElement('label');
  lbl.textContent = labelTexte;
  const select = document.createElement('select');
  const optAucun = document.createElement('option');
  optAucun.value = ''; optAucun.textContent = 'aucun';
  select.appendChild(optAucun);
  for (const type of types) {
    const opt = document.createElement('option');
    opt.value = type; opt.textContent = type;
    select.appendChild(opt);
  }
  select.value = types.includes(valeur) ? valeur : '';
  select.addEventListener('change', () => {
    const val = select.value;
    if (val === '' || types.includes(val)) onChange(val);
  });
  ligne.append(lbl, select);
  return ligne;
}

// =========================================================
// Helpers partagés — lignes de stats (stat-ligne)
// =========================================================

function creerLigneStat(labelTexte, valeur, min, max, onChange) {
  const ligne = document.createElement('div');
  ligne.className = 'stat-ligne';

  const lbl = document.createElement('span');
  lbl.className = 'stat-label';
  lbl.textContent = labelTexte;

  const spanTotal = document.createElement('span');
  spanTotal.className = 'stat-total';
  spanTotal.textContent = valeur;

  const controles = document.createElement('div');
  controles.className = 'stat-controles';
  controles.appendChild(creerStatGroupe('val', valeur, min, max, onChange));

  ligne.append(lbl, spanTotal, controles);
  return { ligne, spanTotal, controles };
}

function creerLigneReadOnly(labelTexte, valeur) {
  const ligne = document.createElement('div');
  ligne.className = 'stat-ligne';

  const lbl = document.createElement('span');
  lbl.className = 'stat-label';
  lbl.textContent = labelTexte;

  const spanTotal = document.createElement('span');
  spanTotal.className = 'stat-total';
  spanTotal.textContent = valeur;

  ligne.append(lbl, spanTotal);
  return { ligne, spanTotal };
}

function creerStatGroupe(labelTexte, valeur, min, max, onChange) {
  const div = document.createElement('div');
  div.className = 'stat-groupe';

  const lbl = document.createElement('span');
  lbl.className = 'stat-groupe-label';
  lbl.textContent = labelTexte;

  const { btnMoins, input, btnPlus } = creerStepperElements(valeur, min, max, onChange);

  div.append(lbl, btnMoins, input, btnPlus);
  return div;
}

// =========================================================
// Helpers DOM
// =========================================================

function mettreAJourLabelOnglet(ficheIndex, nom) {
  const nav = document.getElementById('nav-principal');
  if (!nav) return;
  const btn = nav.querySelector(`button[data-fiche-index="${ficheIndex}"]`);
  if (btn) {
    const spanNom = btn.querySelector('.onglet-nom');
    if (spanNom) spanNom.textContent = nom || 'Nouvelle fiche';
  }
}
