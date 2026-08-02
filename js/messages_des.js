// Module de construction des messages de résultats de jets de dés.
// Modifier ce fichier pour changer tous les textes affichés (popup et historique).

export function prefixeJet(entry) {
  return `🎲 ${entry.label} : ${entry.detail} = `;
}

export function texteAvDes(avDes) {
  if (!avDes) return null;
  return `[${avDes}]`;
}

export function texteCritique(critique) {
  if (critique === 'réussite') return '★ Réussite critique !';
  if (critique === 'échec')    return '✗ Échec critique !';
  return null;
}
