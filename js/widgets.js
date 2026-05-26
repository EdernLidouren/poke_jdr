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
  const div = document.createElement('div');
  div.className = 'widget-jauge';

  const lbl = document.createElement('span');
  lbl.className = 'widget-jauge-label';
  lbl.textContent = label;

  const btnMoins = document.createElement('button');
  btnMoins.type = 'button';
  btnMoins.className = 'btn-ability-qty';
  btnMoins.textContent = '−';

  const spanValeur = document.createElement('span');
  spanValeur.className = 'widget-jauge-valeur';

  const btnPlus = document.createElement('button');
  btnPlus.type = 'button';
  btnPlus.className = 'btn-ability-qty';
  btnPlus.textContent = '+';

  function rafraichir() {
    const c = save.sheets[save.fiche_active].caracs;
    spanValeur.textContent = `${c[cleVal]} / ${c[cleMax]}`;
  }

  rafraichir();

  btnMoins.addEventListener('click', () => {
    const c = save.sheets[save.fiche_active].caracs;
    if (c[cleVal] > 0) {
      c[cleVal]--;
      rafraichir();
      onUpdate(save);
    }
  });

  btnPlus.addEventListener('click', () => {
    const c = save.sheets[save.fiche_active].caracs;
    if (c[cleVal] < c[cleMax]) {
      c[cleVal]++;
      rafraichir();
      onUpdate(save);
    }
  });

  div.append(lbl, btnMoins, spanValeur, btnPlus);
  return div;
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
