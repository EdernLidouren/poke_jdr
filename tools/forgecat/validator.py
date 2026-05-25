from dataclasses import dataclass
import re
import json


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str]


def validate(entity: dict, category: str, schema: dict) -> ValidationResult:
    errors = []

    # 1. La catégorie existe dans le schema
    if category not in schema["categories"]:
        return ValidationResult(valid=False, errors=[f"Catégorie inconnue : '{category}'"])

    cat_schema = schema["categories"][category]
    fields_schema = schema["fields"]

    # 2. Champs requis présents
    for required in cat_schema["required_fields"]:
        if required not in entity:
            errors.append(f"Champ obligatoire manquant : '{required}'")

    # 3. Champs inconnus
    for key in entity:
        if key not in fields_schema:
            errors.append(f"Champ inconnu : '{key}'")

    # 4. Validation des valeurs
    for key, value in entity.items():
        if key not in fields_schema:
            continue  # déjà signalé au dessus, on skip

        field_def = fields_schema[key]
        field_type = field_def["type"]

        if field_type == "text":
            pass  # n'importe quelle string est valide

        elif field_type == "int":
            if not value.lstrip("-").isdigit():
                errors.append(f"'{key}' attend un entier, reçu : '{value}'")

        elif field_type == "enum":
            if value.lower() not in field_def["values"]:
                allowed = ", ".join(field_def["values"])
                errors.append(f"'{key}' : valeur '{value}' non autorisée. Attendu : {allowed}")

        elif field_type == "regex":
            if not re.fullmatch(field_def["pattern"], value):
                errors.append(f"'{key}' : valeur '{value}' ne correspond pas au format attendu")
        elif field_type == "list":
            pass  # n'importe quelle liste de strings séparées par des virgules est valide

    return ValidationResult(valid=len(errors) == 0, errors=errors)


if __name__ == "__main__":
    with open("schema.json", encoding="utf-8") as f:
        schema = json.load(f)
