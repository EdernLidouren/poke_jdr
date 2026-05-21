import sys
from pathlib import Path
import json


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
        print(f"✗ {len(all_errors)} problème(s) détecté(s). Voir dist/errors.txt pour le détail.")
        print("  Aucun fichier JSON généré.")
    else:
        print(f"✓ {total} éléments créés avec succès.")
        for cat, items in catalogue.items():
            print(f"  {cat} : {len(items)} éléments")

    print(f"{'='*40}\n")


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

    sys.exit(1 if all_errors else 0)


if __name__ == "__main__":
    main()