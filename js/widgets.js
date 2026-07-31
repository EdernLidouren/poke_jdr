// Widgets réutilisables — jauges et valeurs calculées

// =========================================================
// Jauges PV / Pouvoir
// =========================================================

export function renderJaugePV(save, onUpdate) {
  return _renderJauge(save, 'PV', 'pv', 'pv_max', onUpdate);
}

export function renderJaugePouvoir(save, onUpdate) {
  return _renderJauge(save, 'Pouvoir', 'pouvoir', 'pouvoir_max', onUpdate);
}

function _renderJauge(save, label, cleVal, cleMax, onUpdate) {
  const ligne = document.createElement('div');
  ligne.className = 'stat-ligne';

  const lbl = document.createElement('span');
  lbl.className = 'stat-label';
  lbl.textContent = label;

  const spanTotal = document.createElement('span');
  spanTotal.className = 'stat-total';

  // Groupe "actuel"
  const groupeActuel = document.createElement('div');
  groupeActuel.className = 'stat-groupe';
  const lblActuel = document.createElement('span');
  lblActuel.className = 'stat-groupe-label';
  lblActuel.textContent = 'actuel';
  const btnActuelMoins = document.createElement('button');
  btnActuelMoins.type = 'button'; btnActuelMoins.className = 'btn-stepper'; btnActuelMoins.textContent = '−';
  const inputActuel = document.createElement('input');
  inputActuel.type = 'number'; inputActuel.min = '0';
  const btnActuelPlus = document.createElement('button');
  btnActuelPlus.type = 'button'; btnActuelPlus.className = 'btn-stepper'; btnActuelPlus.textContent = '+';
  groupeActuel.append(lblActuel, btnActuelMoins, inputActuel, btnActuelPlus);

  // Groupe "max"
  const groupeMax = document.createElement('div');
  groupeMax.className = 'stat-groupe';
  const lblMax = document.createElement('span');
  lblMax.className = 'stat-groupe-label';
  lblMax.textContent = 'max';
  const btnMaxMoins = document.createElement('button');
  btnMaxMoins.type = 'button'; btnMaxMoins.className = 'btn-stepper'; btnMaxMoins.textContent = '−';
  const inputMax = document.createElement('input');
  inputMax.type = 'number'; inputMax.min = '1'; inputMax.max = '999';
  const btnMaxPlus = document.createElement('button');
  btnMaxPlus.type = 'button'; btnMaxPlus.className = 'btn-stepper'; btnMaxPlus.textContent = '+';
  groupeMax.append(lblMax, btnMaxMoins, inputMax, btnMaxPlus);

  function rafraichir() {
    const c = save.sheets[save.fiche_active].caracs;
    spanTotal.textContent = String(c[cleVal]);
    inputActuel.max = String(c[cleMax]);
    inputActuel.value = String(c[cleVal]);
    inputMax.value = String(c[cleMax]);
  }

  rafraichir();

  function clampActuel(brut) {
    const c = save.sheets[save.fiche_active].caracs;
    const val = Math.round(Number(brut));
    if (isNaN(val)) return;
    c[cleVal] = Math.max(0, Math.min(c[cleMax], val));
    rafraichir();
    onUpdate(save);
  }

  function clampMax(brut) {
    const c = save.sheets[save.fiche_active].caracs;
    const val = Math.round(Number(brut));
    if (isNaN(val)) return;
    c[cleMax] = Math.max(1, Math.min(999, val));
    if (c[cleVal] > c[cleMax]) c[cleVal] = c[cleMax];
    rafraichir();
    onUpdate(save);
  }

  btnActuelMoins.addEventListener('click', () => clampActuel(Number(inputActuel.value) - 1));
  btnActuelPlus.addEventListener('click',  () => clampActuel(Number(inputActuel.value) + 1));
  inputActuel.addEventListener('change',   () => clampActuel(inputActuel.value));

  btnMaxMoins.addEventListener('click', () => clampMax(Number(inputMax.value) - 1));
  btnMaxPlus.addEventListener('click',  () => clampMax(Number(inputMax.value) + 1));
  inputMax.addEventListener('change',   () => clampMax(inputMax.value));

  ligne.append(lbl, spanTotal, groupeActuel, groupeMax);
  return { ligne, rafraichir };
}

// =========================================================
// Valeur calculée en lecture seule
// =========================================================

export function renderValeurCalculee(label, valeur) {
  const div = document.createElement('div');
  div.className = 'widget-valeur-calculee';

  const lbl = document.createElement('span');
  lbl.className = 'widget-valeur-label';
  lbl.textContent = label;

  const span = document.createElement('span');
  span.className = 'widget-valeur-total';
  span.textContent = String(valeur);

  div.append(lbl, span);
  return div;
}
