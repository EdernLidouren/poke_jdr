// Onglet Général — blocs Identité et Caractéristiques

export function rendreGeneral(zone, catalogue, save, onSaveChange) {
  const ficheIndex = save.fiche_active;
  const caracs = save.sheets[ficheIndex].caracs;
  zone.replaceChildren(
    construireBlocIdentite(catalogue, caracs, ficheIndex, save, onSaveChange),
    construireBlocCaracteristiques(caracs, save, onSaveChange),
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
        refInputExp.max = val;
        if (Number(refInputExp.value) > val) {
          refInputExp.value = val;
          caracs.expérience = val;
        }
      }
      onSaveChange(save);
    }
  );

  const { conteneur: ligneExp, input: inputExp } = creerChampNombre(
    'Expérience', caracs.expérience, 0, caracs.niveau || 20,
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

  section.append(header, contenu);
  return section;
}

// =========================================================
// Bloc Caractéristiques
// =========================================================

function construireBlocCaracteristiques(caracs, save, onSaveChange) {
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
  let refInputPV       = null;
  let refInputPouvoir  = null;
  let refGardeTotale      = null;
  let refGardeSpecTotale  = null;
  const refTotaux = {};

  function calcGarde()     { return Math.floor(10 + (caracs.constitution + caracs.agilité) / 2) + caracs.garde_mod; }
  function calcGardeSpec() { return Math.floor(10 + (caracs.esprit + caracs.agilité) / 2) + caracs.garde_speciale_mod; }

  function mettreAJourGardes() {
    if (refGardeTotale)     refGardeTotale.textContent     = calcGarde();
    if (refGardeSpecTotale) refGardeSpecTotale.textContent = calcGardeSpec();
  }

  // ---- Sous-bloc secondaires (en premier) ----
  contenu.appendChild(creerTitreSousBloc('Caractéristiques secondaires'));

  // PV | PV max sur une seule ligne
  const { conteneur: lignePV, input1: inputPV, input2: inputPVMax } = creerChampNombreDouble(
    'PV', caracs.pv, 0, caracs.pv_max,
    (val) => { caracs.pv = val; onSaveChange(save); },
    'PV max', caracs.pv_max, 1, 999,
    (val) => {
      caracs.pv_max = val;
      if (refInputPV) {
        refInputPV.max = val;
        if (Number(refInputPV.value) > val) { refInputPV.value = val; caracs.pv = val; }
      }
      onSaveChange(save);
    }
  );
  refInputPV = inputPV;
  contenu.appendChild(lignePV);

  // Pouvoir | Pouvoir max sur une seule ligne
  const { conteneur: lignePouvoir, input1: inputPouvoir, input2: inputPouvMax } = creerChampNombreDouble(
    'Pouvoir', caracs.pouvoir, 0, caracs.pouvoir_max,
    (val) => { caracs.pouvoir = val; onSaveChange(save); },
    'Pouvoir max', caracs.pouvoir_max, 0, 999,
    (val) => {
      caracs.pouvoir_max = val;
      if (refInputPouvoir) {
        refInputPouvoir.max = val;
        if (Number(refInputPouvoir.value) > val) { refInputPouvoir.value = val; caracs.pouvoir = val; }
      }
      onSaveChange(save);
    }
  );
  refInputPouvoir = inputPouvoir;
  contenu.appendChild(lignePouvoir);

  // Garde
  const { ligne: ligneGarde, spanTotal: spanGardeTotale } = creerLigneGarde(
    'Garde', calcGarde(), caracs.garde_mod, -999, 999,
    (val) => { caracs.garde_mod = val; mettreAJourGardes(); onSaveChange(save); }
  );
  refGardeTotale = spanGardeTotale;
  contenu.appendChild(ligneGarde);

  // Garde spéciale
  const { ligne: ligneGardeSpec, spanTotal: spanGardeSpecTotale } = creerLigneGarde(
    'Garde spéciale', calcGardeSpec(), caracs.garde_speciale_mod, -999, 999,
    (val) => { caracs.garde_speciale_mod = val; mettreAJourGardes(); onSaveChange(save); }
  );
  refGardeSpecTotale = spanGardeSpecTotale;
  contenu.appendChild(ligneGardeSpec);

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
    const cleMod = `${cle}_mod`;
    const { ligne, spanTotal } = creerLigneStat(
      label,
      caracs[cle], caracs[cleMod],
      0, 999, -999, 999,
      (val) => {
        caracs[cle] = val;
        refTotaux[cle].textContent = caracs[cle] + caracs[cleMod];
        if (affecteGarde) mettreAJourGardes();
        onSaveChange(save);
      },
      (val) => {
        caracs[cleMod] = val;
        refTotaux[cle].textContent = caracs[cle] + caracs[cleMod];
        if (affecteGarde) mettreAJourGardes();
        onSaveChange(save);
      }
    );
    refTotaux[cle] = spanTotal;
    contenu.appendChild(ligne);
  }

  section.append(header, contenu);
  return section;
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

function creerLigneStat(labelTexte, valeurBase, valeurMod, minBase, maxBase, minMod, maxMod, onChangeBase, onChangeMod) {
  const ligne = document.createElement('div');
  ligne.className = 'stat-ligne';

  const lbl = document.createElement('span');
  lbl.className = 'stat-label';
  lbl.textContent = labelTexte;

  const spanTotal = document.createElement('span');
  spanTotal.className = 'stat-total';
  spanTotal.textContent = valeurBase + valeurMod;

  ligne.append(
    lbl, spanTotal,
    creerStatGroupe('base', valeurBase, minBase, maxBase, onChangeBase),
    creerStatGroupe('mod',  valeurMod,  minMod,  maxMod,  onChangeMod),
  );
  return { ligne, spanTotal };
}

function creerLigneGarde(labelTexte, totalInitial, valeurMod, minMod, maxMod, onChangeMod) {
  const ligne = document.createElement('div');
  ligne.className = 'stat-ligne';

  const lbl = document.createElement('span');
  lbl.className = 'stat-label';
  lbl.textContent = labelTexte;

  const spanTotal = document.createElement('span');
  spanTotal.className = 'stat-total';
  spanTotal.textContent = totalInitial;

  ligne.append(lbl, spanTotal, creerStatGroupe('mod', valeurMod, minMod, maxMod, onChangeMod));
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
  if (btn) btn.textContent = nom || 'Nouvelle fiche';
}
