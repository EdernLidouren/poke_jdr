const CLE_STORAGE = 'pokefiche_save';

const DEFAUT_CARACS = {
  nom: '',
  espèce: '',
  type_1: '',
  type_2: '',
  type_3: '',
  niveau: 1,
  expérience: 0,
  pv_max: 1,
  pv: 1,
  pouvoir_max: 0,
  pouvoir: 0,
  force: 0,
  constitution: 0,
  charisme: 0,
  esprit: 0,
  agilité: 0,
};

const CARACS_TYPES = {
  nom: 'string',
  espèce: 'string',
  type_1: 'string',
  type_2: 'string',
  type_3: 'string',
  niveau: 'number',
  expérience: 'number',
  pv_max: 'number',
  pv: 'number',
  pouvoir_max: 'number',
  pouvoir: 'number',
  force: 'number',
  constitution: 'number',
  charisme: 'number',
  esprit: 'number',
  agilité: 'number',
};

const CHAMPS_TYPE_ENUM = new Set(['type_1', 'type_2', 'type_3']);

function creerFicheDefaut() {
  return {
    caracs: { ...DEFAUT_CARACS },
    skills: {},
    moves: [],
    abilities: [],
    items: {},
  };
}

function creerSauvegardeDefaut() {
  return {
    sheets: [creerFicheDefaut()],
    fiche_active: 0,
  };
}

export function loadSave(catalogue) {
  const raw = localStorage.getItem(CLE_STORAGE);
  if (!raw) return creerSauvegardeDefaut();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return creerSauvegardeDefaut();
  }

  const validated = validateSave(parsed, catalogue);
  return validated !== null ? validated : creerSauvegardeDefaut();
}

export function persistSave(save) {
  localStorage.setItem(CLE_STORAGE, JSON.stringify(save));
}

function validateSave(obj, catalogue) {
  // Erreurs critiques
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  if (!Array.isArray(obj.sheets)) return null;

  if (obj.sheets.length === 0) {
    obj.sheets = [creerFicheDefaut()];
  } else {
    obj.sheets = obj.sheets.map(fiche => validateFiche(fiche, catalogue));
  }

  // Erreur non critique : fiche_active invalide
  if (
    typeof obj.fiche_active !== 'number' ||
    !Number.isInteger(obj.fiche_active) ||
    obj.fiche_active < 0 ||
    obj.fiche_active >= obj.sheets.length
  ) {
    obj.fiche_active = 0;
  }

  return obj;
}

function validateFiche(fiche, catalogue) {
  if (!fiche || typeof fiche !== 'object' || Array.isArray(fiche)) return creerFicheDefaut();

  fiche.caracs = validateCaracs(fiche.caracs, catalogue);

  const idsMove = new Set((catalogue.moves || []).map(m => m.id));
  fiche.moves = Array.isArray(fiche.moves)
    ? fiche.moves.filter(id => typeof id === 'string' && idsMove.has(id))
    : [];

  const idsAbility = new Set((catalogue.abilities || []).map(a => a.id));
  fiche.abilities = Array.isArray(fiche.abilities)
    ? fiche.abilities.filter(id => typeof id === 'string' && idsAbility.has(id))
    : [];

  const idsSkill = new Set((catalogue.skills || []).map(s => s.id));
  if (!fiche.skills || typeof fiche.skills !== 'object' || Array.isArray(fiche.skills)) {
    fiche.skills = {};
  } else {
    for (const cle of Object.keys(fiche.skills)) {
      if (!idsSkill.has(cle)) delete fiche.skills[cle];
    }
  }

  const idsItem = new Set((catalogue.items || []).map(i => i.id));
  if (!fiche.items || typeof fiche.items !== 'object' || Array.isArray(fiche.items)) {
    fiche.items = {};
  } else {
    for (const cle of Object.keys(fiche.items)) {
      if (!idsItem.has(cle)) delete fiche.items[cle];
    }
  }

  return fiche;
}

function validateCaracs(caracs, catalogue) {
  if (!caracs || typeof caracs !== 'object' || Array.isArray(caracs)) {
    return { ...DEFAUT_CARACS };
  }

  const typesValides = new Set(catalogue.types || []);
  const result = {};

  for (const [champ, typeAttendu] of Object.entries(CARACS_TYPES)) {
    const valeur = caracs[champ];

    if (typeof valeur !== typeAttendu) {
      result[champ] = DEFAUT_CARACS[champ];
      continue;
    }

    if (CHAMPS_TYPE_ENUM.has(champ)) {
      result[champ] = (valeur === '' || typesValides.has(valeur)) ? valeur : DEFAUT_CARACS[champ];
    } else {
      result[champ] = valeur;
    }
  }

  return result;
}
