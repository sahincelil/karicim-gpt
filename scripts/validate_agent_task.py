#!/usr/bin/env python3
"""Validate the LEGION task schema and its checked-in example fixture."""
import json
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
schema_path = ROOT / "schemas" / "agent-task.schema.json"
fixture_path = ROOT / "tests" / "fixtures" / "agent-task.valid.json"

schema = json.loads(schema_path.read_text(encoding="utf-8"))
fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
Draft202012Validator.check_schema(schema)
validator = Draft202012Validator(schema, format_checker=FormatChecker())
errors = sorted(validator.iter_errors(fixture), key=lambda error: list(error.path))
if errors:
    for error in errors:
        location = ".".join(str(part) for part in error.path) or "<root>"
        print(f"INVALID {location}: {error.message}")
    raise SystemExit(1)
print("LEGION agent task schema and valid fixture: OK")
