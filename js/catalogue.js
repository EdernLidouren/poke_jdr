const BASE_URL = window.location.hostname === 'localhost' ? '' : '/poke_jdr';

const PREFIXES = {
  moves:     'move_',
  abilities: 'ability_',
  equipment: 'equipment_',
  items:     'item_',
  status:    'status_',
  rules:     'rule_',
};

// =========================================================
// Chargement
// =========================================================

export async function loadCatalogue() {
  // Fetch catalogue, filters et skills en parallèle
  const [rawCatalogue, rawFilters, rawSkills] = await Promise.all([
    fetchJson(`${BASE_URL}/data/catalogue.json`),
    fetchJson(`${BASE_URL}/data/filters.json`),  // null si introuvable — non bloquant
    fetchJson(`${BASE_URL}/data/skills.json`),   // null si introuvable — non bloquant
  ]);

  if (rawCatalogue === null) {
    return { db: null, availableFilters: {} };
  }

  const db = buildCatalogue(rawCatalogue);
  db.competence_carac_defaut = buildSkillsMapping(rawSkills);
  const availableFilters = buildAvailableFilters(db, rawFilters || {});

  return { db, availableFilters };
}

export function hasCatalogueContent(db) {
  if (!db) return false;
  const cats = ['moves', 'abilities', 'skills', 'items', 'rules'];
  return cats.some(c => Array.isArray(db[c]) && db[c].length > 0)
    || (Array.isArray(db.types) && db.types.length > 0);
}

// =========================================================
// Helpers fetch
// =========================================================

async function fetchJson(url) {
  try {
    const reponse = await fetch(url);
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    return await reponse.json();
  } catch {
    return null;
  }
}

// =========================================================
// Construction de db
// =========================================================

function buildCatalogue(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const db = {};

  for (const [categorie, prefixe] of Object.entries(PREFIXES)) {
    db[categorie] = Array.isArray(raw[categorie])
      ? raw[categorie].filter(
          obj => obj && typeof obj === 'object' && typeof obj.id === 'string' && obj.id.startsWith(prefixe)
        )
      : [];
  }

  // skills : tableau de strings plates
  db.skills = Array.isArray(raw.skills)
    ? raw.skills.filter(s => typeof s === 'string')
    : [];

  db.types = Array.isArray(raw.types)
    ? raw.types.filter(t => typeof t === 'string')
    : [];

  return db;
}

// =========================================================
// Construction du mapping compétences → caractéristiques
// =========================================================

function buildSkillsMapping(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result = {};
  for (const [cle, valeur] of Object.entries(raw)) {
    if (typeof cle === 'string' && cle.length > 0 &&
        typeof valeur === 'string' && valeur.length > 0) {
      result[cle] = valeur;
    }
  }
  return result;
}

// =========================================================
// Construction de availableFilters
// =========================================================

function buildAvailableFilters(db, rawFilters) {
  if (!rawFilters || typeof rawFilters !== 'object' || Array.isArray(rawFilters)) return {};

  const commonFilters = estObjetPlat(rawFilters.common) ? rawFilters.common : {};
  const result = {};

  for (const [categorie, entrees] of Object.entries(db)) {
    // Uniquement les tableaux d'objets (skip skills et types qui sont des strings)
    if (!Array.isArray(entrees) || entrees.length === 0) continue;
    if (typeof entrees[0] !== 'object' || entrees[0] === null) continue;

    const catFilters = estObjetPlat(rawFilters[categorie]) ? rawFilters[categorie] : {};
    const merged = { ...commonFilters, ...catFilters };
    if (Object.keys(merged).length === 0) continue;

    result[categorie] = {};

    for (const [champ, config] of Object.entries(merged)) {
      if (!config || typeof config !== 'object') continue;

      if (config.type === 'text') {
        result[categorie][champ] = { type: 'text' };
      } else if (config.type === 'enum') {
        const valeurs = new Set();
        for (const item of entrees) {
          const val = item[champ];
          if (val !== null && val !== undefined && val !== '') valeurs.add(val);
        }
        result[categorie][champ] = { type: 'enum', values: [...valeurs].sort() };
      }
    }

    if (Object.keys(result[categorie]).length === 0) delete result[categorie];
  }

  return result;
}

function estObjetPlat(val) {
  return val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val);
}
