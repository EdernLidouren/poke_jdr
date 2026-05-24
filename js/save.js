const CLE_STORAGE = 'pokefiche_save';

const DEFAUT_CARACS = {
  nom: '',
  espèce: '',
  type_1: '',
  type_2: '',
  type_3: '',
  niveau: 1,
  expérience: 0,
  // Caractéristiques primaires
  force: 0,        force_mod: 0,
  constitution: 0, constitution_mod: 0,
  charisme: 0,     charisme_mod: 0,
  esprit: 0,       esprit_mod: 0,
  agilité: 0,      agilité_mod: 0,
  // Caractéristiques secondaires
  pv_max: 1,       pv: 1,
  pouvoir_max: 0,  pouvoir: 0,
  garde: 0,        garde_mod: 0,
  garde_speciale: 0, garde_speciale_mod: 0,
};

const CARACS_TYPES = {
  nom: 'string',
  espèce: 'string',
  type_1: 'string',
  type_2: 'string',
  type_3: 'string',
  niveau: 'number',
  expérience: 'number',
  force: 'number',        force_mod: 'number',
  constitution: 'number', constitution_mod: 'number',
  charisme: 'number',     charisme_mod: 'number',
  esprit: 'number',       esprit_mod: 'number',
  agilité: 'number',      agilité_mod: 'number',
  pv_max: 'number',       pv: 'number',
  pouvoir_max: 'number',  pouvoir: 'number',
  garde: 'number',        garde_mod: 'number',
  garde_speciale: 'number', garde_speciale_mod: 'number',
};

const CHAMPS_TYPE_ENUM = new Set(['type_1', 'type_2', 'type_3']);

function creerFicheDefaut() {
  return {
    caracs: { ...DEFAUT_CARACS },
    skills: {},
    moves: {
      moves_max: 4,
      current_moves: {},
    },
    abilities: {
      abilities_max: 4,
      current_abilities: {},
    },
    items: {},
  };
}

export function creerSauvegardeDefaut() {
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

  const validated = validerSauvegarde(parsed, catalogue);
  return validated !== null ? validated : creerSauvegardeDefaut();
}

export function persistSave(save) {
  localStorage.setItem(CLE_STORAGE, JSON.stringify(save));
}

export function validerSauvegarde(obj, catalogue) {
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
  if (!fiche.moves || typeof fiche.moves !== 'object' || Array.isArray(fiche.moves)) {
    fiche.moves = { moves_max: 4, current_moves: {} };
  } else {
    if (!Number.isInteger(fiche.moves.moves_max) || fiche.moves.moves_max <= 0) {
      fiche.moves.moves_max = 4;
    }
    if (!fiche.moves.current_moves || typeof fiche.moves.current_moves !== 'object' || Array.isArray(fiche.moves.current_moves)) {
      fiche.moves.current_moves = {};
    } else {
      for (const id of Object.keys(fiche.moves.current_moves)) {
        if (!idsMove.has(id)) {
          console.warn(`[save] moves.current_moves : id "${id}" absent du catalogue → retiré`);
          delete fiche.moves.current_moves[id];
          continue;
        }
        const entree = fiche.moves.current_moves[id];
        if (!entree || typeof entree !== 'object' || Array.isArray(entree)) {
          console.warn(`[save] moves.current_moves["${id}"] : structure invalide (${JSON.stringify(entree)}) → réinitialisé`);
          fiche.moves.current_moves[id] = { is_memorized: true, player_notes: '' };
          continue;
        }
        if (typeof entree.is_memorized !== 'boolean') {
          console.warn(`[save] moves.current_moves["${id}"].is_memorized : valeur non booléenne (${JSON.stringify(entree.is_memorized)}) → réinitialisé à true`);
          entree.is_memorized = true;
        }
        if (typeof entree.player_notes !== 'string') {
          console.warn(`[save] moves.current_moves["${id}"].player_notes : valeur non string (${JSON.stringify(entree.player_notes)}) → réinitialisé à ""`);
          entree.player_notes = '';
        }
      }
    }
  }

  const idsAbility = new Set((catalogue.abilities || []).map(a => a.id));
  if (!fiche.abilities || typeof fiche.abilities !== 'object' || Array.isArray(fiche.abilities)) {
    fiche.abilities = { abilities_max: 4, current_abilities: {} };
  } else {
    if (!Number.isInteger(fiche.abilities.abilities_max) || fiche.abilities.abilities_max <= 0) {
      fiche.abilities.abilities_max = 4;
    }
    if (
      !fiche.abilities.current_abilities ||
      typeof fiche.abilities.current_abilities !== 'object' ||
      Array.isArray(fiche.abilities.current_abilities)
    ) {
      fiche.abilities.current_abilities = {};
    } else {
      for (const id of Object.keys(fiche.abilities.current_abilities)) {
        if (!idsAbility.has(id)) {
          delete fiche.abilities.current_abilities[id];
          continue;
        }
        const entree = fiche.abilities.current_abilities[id];
        if (!entree || typeof entree !== 'object' || Array.isArray(entree)) {
          fiche.abilities.current_abilities[id] = { quantity: 1, player_notes: '' };
          continue;
        }
        if (!Number.isInteger(entree.quantity) || entree.quantity <= 0) {
          entree.quantity = 1;
        }
        if (typeof entree.player_notes !== 'string') {
          entree.player_notes = '';
        }
      }
    }
  }

  const skillsCatalogue = catalogue.skills || [];
  const skillsSave = (fiche.skills && typeof fiche.skills === 'object' && !Array.isArray(fiche.skills))
    ? fiche.skills : {};

  // Signaler les clés présentes dans le save mais absentes du catalogue
  const setSkillsCatalogue = new Set(skillsCatalogue);
  for (const nom of Object.keys(skillsSave)) {
    if (!setSkillsCatalogue.has(nom)) {
      console.warn(`[save] skills : clé "${nom}" absente du catalogue → retirée`);
    }
  }

  const nouvellesSkills = {};
  for (const nom of skillsCatalogue) {
    const entree = skillsSave[nom];
    if (
      entree &&
      typeof entree === 'object' &&
      !Array.isArray(entree) &&
      Number.isInteger(entree.base) &&
      Number.isInteger(entree.mod)
    ) {
      nouvellesSkills[nom] = { base: entree.base, mod: entree.mod };
    } else {
      if (entree !== undefined) {
        console.warn(`[save] skills["${nom}"] : structure invalide (${JSON.stringify(entree)}) → réinitialisé à {base:0, mod:0}`);
      }
      nouvellesSkills[nom] = { base: 0, mod: 0 };
    }
  }
  fiche.skills = nouvellesSkills;

  const idsItem = new Set((catalogue.items || []).map(i => i.id));
  if (!fiche.items || typeof fiche.items !== 'object' || Array.isArray(fiche.items)) {
    fiche.items = {};
  } else {
    for (const cle of Object.keys(fiche.items)) {
      if (!idsItem.has(cle)) {
        console.warn(`[save] items : clé "${cle}" absente du catalogue → retirée`);
        delete fiche.items[cle];
      }
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
