// Table de correspondance champs → libellés d'affichage pour les cellules de capacité

export const LIBELLES_MOVE = {
  contact:           { court: 'Contact',    complet: 'Contact' },
  jet_de_sauvegarde: { court: 'jds',        complet: 'jet de sauvegarde' },
  mouvement_minimal: { court: 'mouv. min.', complet: 'mouvement minimal' },
  mécaniques:        { court: 'méca.',      complet: 'mécaniques' },
  tags:              { court: 'tags',        complet: 'tags' },
};

// Construit la ligne de métadonnées intermédiaire d'une cellule de capacité.
// Renvoie un élément <div class="move-meta"> ou null si aucun champ n'est présent.
export function creerLigneMeta(move) {
  const items = [];

  // contact : libellé seul (pas de valeur), uniquement si "oui"
  if (move.contact && move.contact.toLowerCase() === 'oui') {
    const span = document.createElement('span');
    span.className = 'move-meta-item';
    span.textContent = 'Contact';
    items.push(span);
  }

  // champs affichés sous la forme "libellé : valeur"
  const CHAMPS = [
    ['jet_de_sauvegarde', 'jds',        'jet de sauvegarde'],
    ['mouvement_minimal', 'mouv. min.', 'mouvement minimal'],
    ['mécaniques',        'méca.',      'mécaniques'],
    ['tags',              'tags',       'tags'],
  ];

  for (const [champ, court, complet] of CHAMPS) {
    const valeur = move[champ];
    if (!valeur) continue;
    const span = document.createElement('span');
    span.className = 'move-meta-item';
    if (court !== complet) {
      // aria-label porte la forme longue pour les lecteurs d'écran ;
      // le contenu visible (forme courte) est masqué au lecteur via aria-hidden.
      // Évite le nœud <abbr title> qui crée un focus parasite sous VoiceOver iOS.
      span.setAttribute('aria-label', `${complet} : ${valeur}`);
      const spanVisuel = document.createElement('span');
      spanVisuel.setAttribute('aria-hidden', 'true');
      spanVisuel.textContent = `${court} : ${valeur}`;
      span.appendChild(spanVisuel);
    } else {
      span.textContent = `${court} : ${valeur}`;
    }
    items.push(span);
  }

  if (items.length === 0) return null;

  const div = document.createElement('div');
  div.className = 'move-meta';

  items.forEach((item, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'move-meta-sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = ' · ';
      div.appendChild(sep);
    }
    div.appendChild(item);
  });

  return div;
}
