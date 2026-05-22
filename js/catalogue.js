const PREFIXES = {
  moves: 'move_',
  abilities: 'ability_',
  skills: 'skill_',
  items: 'item_',
  rules: 'rule_',
};

export async function loadCatalogue() {
  let raw;
  try {
    const reponse = await fetch('/data/catalogue.json');
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    raw = await reponse.json();
  } catch {
    return null;
  }
  return buildCatalogue(raw);
}

export function hasCatalogueContent(db) {
  if (!db) return false;
  const cats = ['moves', 'abilities', 'skills', 'items', 'rules'];
  return cats.some(c => Array.isArray(db[c]) && db[c].length > 0)
    || (Array.isArray(db.types) && db.types.length > 0);
}

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

  db.types = Array.isArray(raw.types)
    ? raw.types.filter(t => typeof t === 'string')
    : [];

  return db;
}
