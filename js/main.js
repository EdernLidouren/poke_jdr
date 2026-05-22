import { loadCatalogue, hasCatalogueContent } from './catalogue.js';
import { loadSave, persistSave } from './save.js';
import { afficherErreurChargement, afficherInterfacePrincipale } from './ui.js';

async function init() {
  const catalogue = await loadCatalogue();

  if (!catalogue || !hasCatalogueContent(catalogue)) {
    afficherErreurChargement(
      catalogue === null
        ? 'Le fichier catalogue est introuvable ou illisible.'
        : 'Le catalogue ne contient aucune donnée valide.'
    );
    return;
  }

  const sauvegarde = loadSave(catalogue);
  persistSave(sauvegarde);

  afficherInterfacePrincipale(sauvegarde);
}

init();
