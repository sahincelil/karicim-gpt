#!/usr/bin/env bash
set -euo pipefail

TASK="${TASK:-tree}"
MIN="${MIN:-1}"
KONU="${KONU:-Turkiye guncel}"
EVENT="${EVENT:-unknown}"
SHA="${SHA:-}"

case "$TASK" in
  tree)
    echo "event ${EVENT}"
    echo "sha ${SHA}"
    find . -type f -not -path './.git/*' | sort
    ;;
  skills)
    n=0
    shopt -s nullglob
    for f in .github/skills/*/SKILL.md; do
      test -f "$f"
      grep -q '^name:' "$f"
      grep -q '^description:' "$f"
      echo "ok $f"
      n=$((n + 1))
    done
    test "$n" -ge "$MIN"
    echo "skills $n (min $MIN)"
    ;;
  nabiz)
    echo "event ${EVENT}"
    echo "konu ${KONU}"
    echo "Bu runner grok-4.5 değil. C: yok."
    test -f NABIZ.md
    test -f .github/skills/karicim-nabiz/SKILL.md
    ;;
  *)
    echo "bilinmeyen TASK=$TASK" >&2
    exit 1
    ;;
esac
