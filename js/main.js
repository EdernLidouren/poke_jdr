import { loadCatalogue, hasCatalogueContent } from './catalogue.js';
import { loadSave, persistSave } from './save.js';
import { afficherErreurChargement, afficherInterfacePrincipale } from './ui.js';
import { chargerTheme } from './theme.js';

// Appliquer le thème avant le premier rendu pour éviter le flash
chargerTheme();

async function init() {
  const { db, availableFilters } = await loadCatalogue();

  if (!db || !hasCatalogueContent(db)) {
    afficherErreurChargement(
      db === null
        ? 'Le fichier catalogue est introuvable ou illisible.'
        : 'Le catalogue ne contient aucune donnée valide.'
    );
    return;
  }

  const sauvegarde = loadSave(db);
  persistSave(sauvegarde);

  afficherInterfacePrincipale(db, sauvegarde, (save) => persistSave(save), availableFilters);
}

init();
