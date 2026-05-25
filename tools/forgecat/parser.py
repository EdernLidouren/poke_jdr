import re
import unicodedata
from pathlib import Path

from validator import validate


SOURCE_DIR = Path("source")


def normalize(text: str) -> str:
    """Minuscules, sans accents, espaces -> underscores."""
    nfkd = unicodedata.normalize("NFKD", text.lower().strip())
    ascii_str = nfkd.encode("ascii", "ignore").decode("ascii")
    return re.sub(r'\s+', '_', ascii_str)


def parse_file(filepath: Path) -> dict:
    """Extrait les paires clé/valeur d'un fichier .txt."""
    entity = {}
    with open(filepath, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if ":" not in line:
                continue
            key, value = line.split(":", 1)
            key = key.strip().lower()
            value = value.strip()
            if key and value:
                entity[key] = value
    return entity


def build_id(prefix: str, nom: str) -> str:
    return f"{prefix}_{normalize(nom)}"


def parse_catalogue(schema: dict) -> tuple[dict, list[str]]:
    catalogue = {}
    all_errors = []
    seen_ids = {}

    for category, cat_schema in schema["categories"].items():
        category_dir = SOURCE_DIR / category
        catalogue[category] = []

        if not category_dir.exists():
            all_errors.append(f"[AVERTISSEMENT] Dossier absent : {category_dir}")
            continue

        txt_files = sorted(category_dir.rglob("*.txt"))

        if not txt_files:
            all_errors.append(f"[AVERTISSEMENT] Aucun fichier .txt dans : {category_dir}")
            continue

        for filepath in txt_files:
            entity = parse_file(filepath)

            if not entity:
                all_errors.append(f"\n{filepath}\n  - Fichier vide ou non parseable")
                continue

            result = validate(entity, category, schema)

            if not result.valid:
                error_block = f"\n{filepath}"
                for err in result.errors:
                    error_block += f"\n  - {err}"
                all_errors.append(error_block)
                continue

            nom = entity.get("nom", "")
            entity_id = build_id(cat_schema["id_prefix"], nom)

            if entity_id in seen_ids:
                all_errors.append(
                    f"\n{filepath}\n  - ID en doublon : '{entity_id}' "
                    f"(déjà défini dans {seen_ids[entity_id]})"
                )
                continue

            seen_ids[entity_id] = str(filepath)
            # Convertir les champs de type list en tableaux
            for key, value in entity.items():
                if key in schema["fields"] and schema["fields"][key]["type"] == "list":
                    entity[key] = [
                        normalize(v.strip()) 
                        for v in value.split(",") 
                        if v.strip()
                    ]
            entity["id"] = entity_id
            catalogue[category].append(entity)

    return catalogue, all_errors