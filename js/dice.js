// Module dés — jets de dés, historique, bloc lanceur

export const FACES_DISPONIBLES = [4, 6, 8, 10, 12, 20, 100];

export const CARACS_PRIMAIRES = ['force', 'constitution', 'charisme', 'esprit', 'agilité'];

// Mapping compétence → caractéristique primaire par défaut
export const COMPETENCE_CARAC_DEFAUT = {
  acrobatie:  'agilité',
  perception: 'esprit',
  survie:     'esprit',
};

// Modificateurs internes (non exposés dans l'UI pour l'instant)
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
 * Jet de compétence : 1d20 + scoreCompetence + valeurCarac
 * @returns {{ label, detail, total, critique }}
 */
export function lancerJetCompetence(nomCompetence, scoreCompetence, nomCarac, valeurCarac) {
  const { total: de, critique } = lancerDe(20, 1);
  const total = de + scoreCompetence + valeurCarac;
  const entry = {
    label:   nomCompetence,
    detail:  `d20(${de}) + ${scoreCompetence} + ${valeurCarac}`,
    total,
    critique,
  };
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
  btnLancer.className = 'des-btn-lancer';
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
// Helper interne
// =========================================================

function _ajouterHistorique(entry) {
  _historique.unshift(entry);
  if (_historique.length > TAILLE_HISTORIQUE) {
    _historique.length = TAILLE_HISTORIQUE;
  }
}
