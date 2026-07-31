import sys
import shutil
import json
from pathlib import Path


SITE_DATA_DIR = Path("../../data")
ERRORS_FILE = Path("errors.txt")
DIST_CATALOGUE = Path("dist/catalogue.json")


def check_environment() -> bool:
    ok = True
    if not Path("schema.json").exists():
        print("Erreur fatale : schema.json introuvable.")
        ok = False
    if not Path("source").exists():
        print("Erreur fatale : dossier source/ introuvable.")
        ok = False
    return ok


def print_report(catalogue: dict, all_errors: list[str]):
    total = sum(len(items) for items in catalogue.values())
    print(f"\n{'='*40}")
    if all_errors:
        print(f"✗ {len(all_errors)} problème(s) détecté(s). Voir errors.txt pour le détail.")
        print("  Aucun fichier JSON généré.")
    else:
        print(f"✓ {total} éléments créés avec succès.")
        for cat, items in catalogue.items():
            print(f"  {cat} : {len(items)} éléments")
    print(f"{'='*40}\n")


def write_errors(all_errors: list[str]):
    with open(ERRORS_FILE, "w", encoding="utf-8") as f:
        f.write("RAPPORT D'ERREURS FORGECAT\n")
        f.write("=" * 40 + "\n")
        for err in all_errors:
            f.write(err + "\n")


def write_catalogue(catalogue: dict):
    SITE_DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(SITE_DATA_DIR / "catalogue.json", "w", encoding="utf-8") as f:
        json.dump(catalogue, f, ensure_ascii=False, indent=2)
    print(f"Catalogue écrit vers {SITE_DATA_DIR / 'catalogue.json'}")


def add_catalogue_base(catalogue):
    """Ajoute au catalogue une base externe. Reçoit un dictionnaire et renvoie un dictionnaire."""
    catalogue_base = {
        "types": [
            "aucun", "feu", "eau", "plante", "électrique", "normal", "glace", "poison", "vol", "sol", "combat", "dragon", "psy", "acier", "spectre", "fée", "ténèbres", "insecte",
            "feu (fantôme)", "eau (fantôme)", "plante (fantôme)", "électrique (fantôme)", "normal (fantôme)", "glace (fantôme)", "vol (fantôme)", "sol (fantôme)", "combat (fantôme)", "dragon (fantôme)", "psy (fantôme)", "acier (fantôme)", "spectre (fantôme)", "fée (fantôme)", "ténèbres (fantôme)", "insecte (fantôme)", "poison (fantôme)"
        ],
        "skills": [
            "acrobatie", "athlétisme", "autorité", "discipline", "discrétion", "éloquence", "érudition", "médecine", "perception", "perspicacité", "roublardise", "survie"
        ]
    }
    catalogue.update(catalogue_base)
    return catalogue

def main():
    print("\nFORGECAT — Générateur de catalogue JDR")
    print("=" * 40)

    if not check_environment():
        print("\nArrêt. Corrigez les erreurs ci-dessus et relancez.")
        sys.exit(1)

    with open("schema.json", encoding="utf-8") as f:
        schema = json.load(f)

    categories = list(schema.get("categories", {}).keys())
    if not categories:
        print("Erreur fatale : aucune catégorie définie dans schema.json.")
        sys.exit(1)

    print(f"Catégories détectées : {', '.join(categories)}")
    print("Lancement du parsing...")

    from parser import parse_catalogue
    catalogue, all_errors = parse_catalogue(schema)

    print_report(catalogue, all_errors)

    if all_errors:
        write_errors(all_errors)
        sys.exit(1)
    else:
        # On ajoute une base au catalogue avant écriture :
        catalogue = add_catalogue_base(catalogue)
        write_catalogue(catalogue)
        sys.exit(0)


if __name__ == "__main__":
    main()