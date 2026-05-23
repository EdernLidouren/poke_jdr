// Onglet Général — bloc Identité

export function rendreGeneral(zone, catalogue, save, onSaveChange) {
  const ficheIndex = save.fiche_active;
  const caracs = save.sheets[ficheIndex].caracs;
  zone.replaceChildren(construireBlocIdentite(catalogue, caracs, ficheIndex, save, onSaveChange));
}

// --- Bloc Identité ---

function construireBlocIdentite(catalogue, caracs, ficheIndex, save, onSaveChange) {
  const section = document.createElement('section');
  section.className = 'bloc';

  // En-tête avec titre et bouton toggle
  const header = document.createElement('div');
  header.className = 'bloc-header';

  const h2 = document.createElement('h2');
  h2.textContent = 'Identité';

  const btnToggle = document.createElement('button');
  btnToggle.type = 'button';
  btnToggle.className = 'btn-toggle';
  btnToggle.textContent = '▲';
  btnToggle.setAttribute('aria-expanded', 'true');

  header.append(h2, btnToggle);

  // Zone de contenu
  const contenu = document.createElement('div');
  contenu.className = 'bloc-contenu';

  btnToggle.addEventListener('click', () => {
    const estOuvert = !contenu.hidden;
    contenu.hidden = estOuvert;
    btnToggle.textContent = estOuvert ? '▼' : '▲';
    btnToggle.setAttribute('aria-expanded', String(!estOuvert));
  });

  // --- Champs texte ---

  contenu.appendChild(creerChampTexte('Nom', caracs.nom, 30, (val) => {
    caracs.nom = val;
    onSaveChange(save);
    mettreAJourLabelOnglet(ficheIndex, val);
  }));

  contenu.appendChild(creerChampTexte('Espèce', caracs.espèce, 30, (val) => {
    caracs.espèce = val;
    onSaveChange(save);
  }));

  // --- Niveau et Expérience (référence croisée pour le max) ---

  // refInputExp est résolu après la création de l'input expérience
  let refInputExp = null;

  const { conteneur: ligneNiveau } = creerChampNombre(
    'Niveau', caracs.niveau, 1, 20,
    (val) => {
      caracs.niveau = val;
      // Met à jour le max de l'expérience et clampe si nécessaire
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
    (val) => {
      caracs.expérience = val;
      onSaveChange(save);
    }
  );
  refInputExp = inputExp;

  contenu.append(ligneNiveau, ligneExp);

  // --- Sélecteurs de type ---

  const typesDisponibles = catalogue.types || [];

  contenu.appendChild(creerChampSelect('Type 1', caracs.type_1, typesDisponibles, (val) => {
    caracs.type_1 = val;
    onSaveChange(save);
  }));

  contenu.appendChild(creerChampSelect('Type 2', caracs.type_2, typesDisponibles, (val) => {
    caracs.type_2 = val;
    onSaveChange(save);
  }));

  contenu.appendChild(creerChampSelect('Type 3', caracs.type_3, typesDisponibles, (val) => {
    caracs.type_3 = val;
    onSaveChange(save);
  }));

  section.append(header, contenu);
  return section;
}

// --- Constructeurs de champs ---

function creerChampTexte(labelTexte, valeur, maxlength, onChange) {
  const ligne = document.createElement('div');
  ligne.className = 'champ-ligne';

  const lbl = document.createElement('label');
  lbl.textContent = labelTexte;

  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = maxlength;
  input.value = valeur;

  // 'input' pour mise à jour en temps réel (notamment le label d'onglet pour Nom)
  input.addEventListener('input', () => onChange(input.value));

  ligne.append(lbl, input);
  return ligne;
}

function creerChampNombre(labelTexte, valeur, min, max, onChange) {
  const ligne = document.createElement('div');
  ligne.className = 'champ-ligne';

  const lbl = document.createElement('label');
  lbl.textContent = labelTexte;

  const btnMoins = document.createElement('button');
  btnMoins.type = 'button';
  btnMoins.className = 'btn-stepper';
  btnMoins.textContent = '−';

  const input = document.createElement('input');
  input.type = 'number';
  input.min = min;
  input.max = max;
  input.value = valeur;

  const btnPlus = document.createElement('button');
  btnPlus.type = 'button';
  btnPlus.className = 'btn-stepper';
  btnPlus.textContent = '+';

  // Lit toujours min/max depuis les attributs DOM (peuvent être mis à jour de l'extérieur)
  function clampEtNotifier(brut) {
    const lo = Number(input.min);
    const hi = Number(input.max);
    const val = Math.round(Number(brut));
    if (isNaN(val)) return;
    const clamped = Math.max(lo, Math.min(hi, val));
    input.value = clamped;
    onChange(clamped);
  }

  btnMoins.addEventListener('click', () => clampEtNotifier(Number(input.value) - 1));
  btnPlus.addEventListener('click',  () => clampEtNotifier(Number(input.value) + 1));
  input.addEventListener('change',   () => clampEtNotifier(input.value));

  ligne.append(lbl, btnMoins, input, btnPlus);
  return { conteneur: ligne, input };
}

function creerChampSelect(labelTexte, valeur, types, onChange) {
  const ligne = document.createElement('div');
  ligne.className = 'champ-ligne';

  const lbl = document.createElement('label');
  lbl.textContent = labelTexte;

  const select = document.createElement('select');

  const optAucun = document.createElement('option');
  optAucun.value = '';
  optAucun.textContent = 'aucun';
  select.appendChild(optAucun);

  for (const type of types) {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    select.appendChild(opt);
  }

  // Applique la valeur sauvegardée ('' si hors catalogue = valeur par défaut)
  select.value = types.includes(valeur) ? valeur : '';

  select.addEventListener('change', () => {
    const val = select.value;
    if (val === '' || types.includes(val)) onChange(val);
  });

  ligne.append(lbl, select);
  return ligne;
}

// --- Helpers DOM ---

function mettreAJourLabelOnglet(ficheIndex, nom) {
  const nav = document.getElementById('nav-principal');
  if (!nav) return;
  const btn = nav.querySelector(`button[data-fiche-index="${ficheIndex}"]`);
  if (btn) btn.textContent = nom || 'Nouvelle fiche';
}
