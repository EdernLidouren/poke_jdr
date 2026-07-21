// Module dés — jets de dés, historique, bloc lanceur

export const FACES_DISPONIBLES = [4, 6, 8, 10, 12, 20, 100];

export const CARACS_PRIMAIRES = ['force', 'constitution', 'charisme', 'esprit', 'agilité'];

// Mapping compétence → caractéristique primaire par défaut
export const COMPETENCE_CARAC_DEFAUT = {
  acrobatie:  'agilité',
  perception: 'esprit',
  survie:     'esprit',
};

// Niveau de compétence (-3…3) → bonus fixe + contribution avantage/désavantage pour ce jet
// avBonus > 0 : ajoute un avantage ; avBonus < 0 : ajoute un désavantage
const NIVEAUX_COMPETENCE = new Map([
  [ 3, { bonus:  5, avBonus:  1 }],
  [ 2, { bonus:  5, avBonus:  0 }],
  [ 1, { bonus:  2, avBonus:  0 }],
  [ 0, { bonus:  0, avBonus:  0 }],
  [-1, { bonus: -2, avBonus:  0 }],
  [-2, { bonus: -5, avBonus:  0 }],
  [-3, { bonus: -5, avBonus: -1 }],
]);

// Modificateurs globaux (futurs contrôles UI)
let avantage    = 0;
let désavantage = 0;

const TAILLE_HISTORIQUE = 5;
const _historique = [];

// =========================================================
// Fonctions de lancer
// =========================================================

/**
 * Lance `nombreDes` dés à `faces` faces.
 * @returns {{ resultats: number[], total: number, critique: 'réussite'|'échec'|null }}
 */
export function lancerDe(faces, nombreDes = 1) {
  const resultats = [];
  for (let i = 0; i < nombreDes; i++) {
    resultats.push(Math.floor(Math.random() * faces) + 1);
  }
  const total = resultats.reduce((s, v) => s + v, 0);

  let critique = null;
  if (nombreDes === 1) {
    if (faces === 20) {
      if (total === 20)    critique = 'réussite';
      else if (total === 1) critique = 'échec';
    } else if (faces === 100) {
      if (total <= 5)       critique = 'réussite';
      else if (total >= 96) critique = 'échec';
    }
  }

  return { resultats, total, critique };
}

/**
 * Jet de caractéristique : 1d20 + valeurCarac
 * @returns {{ label, detail, total, critique }}
 */
export function lancerJetCarac(nomCarac, valeurCarac) {
  const { total: de, critique } = lancerDe(20, 1);
  const total = de + valeurCarac;
  const entry = {
    label:   nomCarac,
    detail:  `d20(${de}) + ${valeurCarac}`,
    total,
    critique,
  };
  _ajouterHistorique(entry);
  return entry;
}

/**
 * Jet de compétence avec résolution avantage/désavantage et bonus de niveau.
 * @param {string} nomCompetence
 * @param {number} niveauCompetence  Valeur [-3, 3] issue de calcTotalSkill
 * @param {string} nomCarac
 * @param {number} valeurCarac
 * @returns {{ label, detail, total, critique, avDes }}
 */
export function lancerJetCompetence(nomCompetence, niveauCompetence, nomCarac, valeurCarac) {
  const { bonus, avBonus } = NIVEAUX_COMPETENCE.get(niveauCompetence) ?? { bonus: 0, avBonus: 0 };
  const solde = (avantage + Math.max(0,  avBonus))
              - (désavantage + Math.max(0, -avBonus));

  const { de, desLances, retenuIdx, avDes } = _tirerD20(solde);

  const total = de + valeurCarac + bonus;

  let critique = null;
  if (de === 20) critique = 'réussite';
  else if (de === 1) critique = 'échec';

  const signBonus = bonus === 0 ? '' : bonus > 0 ? ` + ${bonus}` : ` − ${Math.abs(bonus)}`;

  let detail;
  if (avDes) {
    const [d1, d2] = desLances;
    const d1Str = retenuIdx === 0 ? `${d1}→retenu` : String(d1);
    const d2Str = retenuIdx === 1 ? `${d2}→retenu` : String(d2);
    detail = `d20(${d1Str}, ${d2Str}) + ${valeurCarac} (${nomCarac})${signBonus}`;
  } else {
    detail = `d20(${de}) + ${valeurCarac} (${nomCarac})${signBonus}`;
  }

  const entry = { label: nomCompetence, detail, total, critique, avDes };
  _ajouterHistorique(entry);
  return entry;
}

/**
 * Jet libre : nombreDes dés à faces faces, sans modificateur.
 * @returns {{ label, detail, total, critique }}
 */
export function lancerJetLibre(faces, nombreDes) {
  const { resultats, total, critique } = lancerDe(faces, nombreDes);
  const label = `${nombreDes}d${faces}`;
  const entry = {
    label,
    detail:  `${label}(${resultats.join(', ')})`,
    total,
    critique,
  };
  _ajouterHistorique(entry);
  return entry;
}

/**
 * Retourne une copie de l'historique (plus récent en premier).
 */
export function getHistorique() {
  return [..._historique];
}

// =========================================================
// Rendu du bloc lanceur de dés
// =========================================================

/**
 * Crée le bloc "Dés" complet avec toggle, historique et jet libre.
 * @returns {{ section: HTMLElement, rafraichirHistorique: () => void }}
 */
export function rendreBlocDes() {
  const section = document.createElement('section');
  section.className = 'bloc';

  // En-tête avec toggle
  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Dés';
  const btnToggle = document.createElement('button');
  btnToggle.type = 'button';
  btnToggle.className = 'btn-toggle';
  btnToggle.textContent = '▲';
  btnToggle.setAttribute('aria-expanded', 'true');
  header.append(h2, btnToggle);

  const corps = document.createElement('div');
  corps.className = 'bloc-contenu';

  btnToggle.addEventListener('click', () => {
    const estOuvert = !corps.hidden;
    corps.hidden = estOuvert;
    btnToggle.textContent = estOuvert ? '▼' : '▲';
    btnToggle.setAttribute('aria-expanded', String(!estOuvert));
  });

  // --- Zone historique ---
  const zoneHisto = document.createElement('div');
  zoneHisto.className = 'des-historique';

  function rafraichirHistorique() {
    zoneHisto.replaceChildren();
    const histo = getHistorique();
    if (histo.length === 0) {
      const p = document.createElement('p');
      p.className = 'des-histo-vide';
      p.textContent = 'Aucun jet effectué.';
      zoneHisto.appendChild(p);
      return;
    }
    for (const entry of histo) {
      const ligne = document.createElement('div');
      ligne.className = 'des-histo-ligne';
      if (entry.critique === 'réussite')  ligne.classList.add('des-histo-reussite');
      else if (entry.critique === 'échec') ligne.classList.add('des-histo-echec');

      ligne.textContent = `🎲 ${entry.label} : ${entry.detail} = ${entry.total}`;

      if (entry.avDes) {
        const badge = document.createElement('span');
        badge.className = 'des-avdes';
        badge.textContent = `  [${entry.avDes}]`;
        ligne.appendChild(badge);
      }

      if (entry.critique) {
        const badge = document.createElement('span');
        badge.className = 'des-critique';
        badge.textContent = entry.critique === 'réussite'
          ? '  ★ Réussite critique !'
          : '  ✗ Échec critique !';
        ligne.appendChild(badge);
      }
      zoneHisto.appendChild(ligne);
    }
  }

  rafraichirHistorique();

  // --- Zone jet libre ---
  const zoneJetLibre = document.createElement('div');
  zoneJetLibre.className = 'des-jet-libre';

  const selectNombre = document.createElement('select');
  selectNombre.className = 'des-select';
  for (let i = 1; i <= 10; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = String(i);
    selectNombre.appendChild(opt);
  }

  const selectFaces = document.createElement('select');
  selectFaces.className = 'des-select';
  for (const f of FACES_DISPONIBLES) {
    const opt = document.createElement('option');
    opt.value = String(f);
    opt.textContent = `d${f}`;
    selectFaces.appendChild(opt);
  }
  selectFaces.value = '20';

  const btnLancer = document.createElement('button');
  btnLancer.type = 'button';
  btnLancer.className = 'btn-lancer';
  btnLancer.textContent = 'Lancer';
  btnLancer.addEventListener('click', () => {
    lancerJetLibre(parseInt(selectFaces.value, 10), parseInt(selectNombre.value, 10));
    rafraichirHistorique();
  });

  zoneJetLibre.append(selectNombre, selectFaces, btnLancer);
  corps.append(zoneHisto, zoneJetLibre);
  section.append(header, corps);

  return { section, rafraichirHistorique };
}

// =========================================================
// Helpers internes
// =========================================================

// Lance 1 ou 2d20 selon le solde avantage/désavantage.
// solde > 0 → avantage (garder le meilleur) ; solde < 0 → désavantage (garder le pire).
function _tirerD20(solde) {
  if (solde === 0) {
    const de = Math.floor(Math.random() * 20) + 1;
    return { de, desLances: null, retenuIdx: null, avDes: null };
  }
  const d1 = Math.floor(Math.random() * 20) + 1;
  const d2 = Math.floor(Math.random() * 20) + 1;
  const avDes = solde > 0 ? 'avantage' : 'désavantage';
  // avantage → max ; désavantage → min. En cas d'égalité, d2 est retenu (indice 1).
  const retenuIdx = solde > 0
    ? (d2 >= d1 ? 1 : 0)
    : (d2 <= d1 ? 1 : 0);
  const de = retenuIdx === 1 ? d2 : d1;
  return { de, desLances: [d1, d2], retenuIdx, avDes };
}

function _ajouterHistorique(entry) {
  _historique.unshift(entry);
  if (_historique.length > TAILLE_HISTORIQUE) {
    _historique.length = TAILLE_HISTORIQUE;
  }
}
