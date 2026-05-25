// Onglet Combat

const STATUTS_SANS_DECREMENT = ['status_blessure', 'status_regeneration'];

export function rendreCombat(zone, catalogue, save, onSaveChange) {
  const statusMap = new Map((catalogue.status || []).map(s => [s.id, s]));

  // =========================================================
  // Bloc "Statuts"
  // =========================================================

  const section = document.createElement('section');
  section.className = 'bloc';

  const header = document.createElement('div');
  header.className = 'bloc-header';
  const h2 = document.createElement('h2');
  h2.textContent = 'Statuts';
  const btnToggle = creerBtnToggle(false); // développé par défaut
  header.append(h2, btnToggle);

  const corps = document.createElement('div');
  corps.className = 'bloc-contenu';
  brancherToggle(btnToggle, corps);

  // Zone statuts actifs
  const zoneStatuts = document.createElement('div');
  zoneStatuts.className = 'cf-statuts-actifs';

  // Zone d'ajout (vide pour l'instant)
  const zoneAjout = document.createElement('div');
  zoneAjout.id = 'zone-ajout-statut';

  corps.append(zoneStatuts, zoneAjout);
  section.append(header, corps);
  zone.appendChild(section);

  construireListe();

  // =========================================================
  // Construction de la liste des statuts actifs
  // =========================================================

  function construireListe() {
    zoneStatuts.replaceChildren();

    const statuts = save.sheets[save.fiche_active].current_fight.statuts;
    const entries = Object.entries(statuts)
      .map(([id, valeur]) => ({ id, valeur, status: statusMap.get(id) }))
      .filter(({ status }) => status !== undefined);

    if (entries.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'cf-statuts-vide';
      msg.textContent = 'Aucun statut actif.';
      zoneStatuts.appendChild(msg);
      return;
    }

    for (const { id, status } of entries) {
      zoneStatuts.appendChild(creerLigneStatut(id, status));
    }
  }

  function creerLigneStatut(id, status) {
    const div = document.createElement('div');
    div.className = 'cf-statut-ligne';
    div.dataset.statusId = id;

    // Ligne d'entête : [×] [−] [nom] [valeur] [+] [▼]
    const entete = document.createElement('div');
    entete.className = 'cf-statut-entete';

    // Bouton ×
    const btnX = document.createElement('button');
    btnX.type = 'button';
    btnX.className = 'cf-btn-supprimer';
    btnX.textContent = '×';
    btnX.addEventListener('click', () => supprimerStatut(id, div));
    entete.appendChild(btnX);

    // Bouton − (absent pour les statuts sans décrément)
    if (!STATUTS_SANS_DECREMENT.includes(id)) {
      const btnMoins = document.createElement('button');
      btnMoins.type = 'button';
      btnMoins.className = 'btn-ability-qty';
      btnMoins.textContent = '−';
      btnMoins.addEventListener('click', () => {
        const sf = save.sheets[save.fiche_active].current_fight.statuts;
        if (!(id in sf)) return;
        if (sf[id] === 1) {
          supprimerStatut(id, div);
        } else {
          sf[id]--;
          onSaveChange(save);
          spanValeur.textContent = String(sf[id]);
        }
      });
      entete.appendChild(btnMoins);
    }

    // Nom du statut
    const spanNom = document.createElement('span');
    spanNom.className = 'cf-statut-nom';
    spanNom.textContent = status.nom;
    entete.appendChild(spanNom);

    // Valeur
    const spanValeur = document.createElement('span');
    spanValeur.className = 'cf-statut-valeur';
    spanValeur.textContent = String(save.sheets[save.fiche_active].current_fight.statuts[id]);
    entete.appendChild(spanValeur);

    // Bouton +
    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'btn-ability-qty';
    btnPlus.textContent = '+';
    btnPlus.addEventListener('click', () => {
      const sf = save.sheets[save.fiche_active].current_fight.statuts;
      if (!(id in sf)) return;
      if (sf[id] < 99) {
        sf[id]++;
        onSaveChange(save);
        spanValeur.textContent = String(sf[id]);
      }
    });
    entete.appendChild(btnPlus);

    // Bouton développer/réduire effets
    const btnEffets = document.createElement('button');
    btnEffets.type = 'button';
    btnEffets.className = 'cf-btn-effets';
    btnEffets.textContent = '▼';
    entete.appendChild(btnEffets);

    div.appendChild(entete);

    // Bloc effets (réduit par défaut)
    const divEffets = document.createElement('div');
    divEffets.className = 'cf-statut-effets';
    divEffets.textContent = status.effets || '';
    divEffets.hidden = true;

    btnEffets.addEventListener('click', () => {
      divEffets.hidden = !divEffets.hidden;
      btnEffets.textContent = divEffets.hidden ? '▼' : '▲';
    });

    div.appendChild(divEffets);
    return div;
  }

  function supprimerStatut(id, ligneEl) {
    const sf = save.sheets[save.fiche_active].current_fight.statuts;
    delete sf[id];
    onSaveChange(save);
    ligneEl.remove();
    // Afficher le message vide si plus aucun statut actif
    if (Object.keys(save.sheets[save.fiche_active].current_fight.statuts).length === 0) {
      construireListe();
    }
  }
}

// =========================================================
// Helpers — toggle
// =========================================================

function creerBtnToggle(collapsed = false) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-toggle';
  btn.textContent = collapsed ? '▼' : '▲';
  btn.setAttribute('aria-expanded', String(!collapsed));
  return btn;
}

function brancherToggle(btnToggle, contenu) {
  btnToggle.addEventListener('click', () => {
    const estOuvert = !contenu.hidden;
    contenu.hidden = estOuvert;
    btnToggle.textContent = estOuvert ? '▼' : '▲';
    btnToggle.setAttribute('aria-expanded', String(!estOuvert));
  });
}
