#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${GITHUB_WORKSPACE:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
CONTRACTS_DIR="$REPO_ROOT/contracts"
TARGET_DIR="$CONTRACTS_DIR/target/excluded-crates-report"
mkdir -p "$TARGET_DIR"

mapfile -t CRATES < <(python3 - "$CONTRACTS_DIR/Cargo.toml" <<'PY'
import sys
import tomllib

with open(sys.argv[1], "rb") as fh:
    data = tomllib.load(fh)

workspace = data.get("workspace", {})
exclude = workspace.get("exclude", [])
for crate in exclude:
    print(crate)
PY
)

{
  echo "## Excluded crates report"
  echo
  printf "| Crate | Clippy | Tests | First error |\n"
  printf "| --- | --- | --- | --- |\n"
  for crate in "${CRATES[@]}"; do
    if [[ -z "$crate" ]]; then
      continue
    fi

    crate_dir="$CONTRACTS_DIR/$crate"
    clippy_log="$TARGET_DIR/${crate}-clippy.log"
    test_log="$TARGET_DIR/${crate}-tests.log"

    clippy_status="pass"
    test_status="pass"
    first_error="—"

    if ! (cd "$crate_dir" && CARGO_TARGET_DIR="$TARGET_DIR" cargo clippy --all-targets --all-features -- -D warnings >"$clippy_log" 2>&1); then
      clippy_status="fail"
      candidate="$(grep -E 'error\\[|error:|panicked at|could not compile|failed:|E[0-9]+' "$clippy_log" | head -n 1 || true)"
      if [[ -n "$candidate" ]]; then
        first_error="$candidate"
      fi
    fi

    if ! (cd "$crate_dir" && CARGO_TARGET_DIR="$TARGET_DIR" cargo test --locked >"$test_log" 2>&1); then
      test_status="fail"
      if [[ "$first_error" == "—" ]]; then
        candidate="$(grep -E 'error\\[|error:|panicked at|could not compile|failed:|E[0-9]+' "$test_log" | head -n 1 || true)"
        if [[ -n "$candidate" ]]; then
          first_error="$candidate"
        fi
      fi
    fi

    if [[ -n "$first_error" && "$first_error" != "—" ]]; then
      first_error="$(printf '%s' "$first_error" | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')"
    else
      first_error="—"
    fi

    printf "| %s | %s | %s | %s |\n" "$crate" "$clippy_status" "$test_status" "$first_error"
  done
} > "$TARGET_DIR/report.md"

{
  echo "## Excluded crates report"
  echo
  cat "$TARGET_DIR/report.md"
} >> "$GITHUB_STEP_SUMMARY"

ISSUE_TITLE="Excluded crates report"
ISSUE_BODY="$(cat <<EOF
# Excluded crates report

Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

$(cat "$TARGET_DIR/report.md")
EOF
)"

if command -v gh >/dev/null 2>&1; then
  issue_number="$(gh issue list --state all --limit 50 --search "Excluded crates report" --json number,title --jq '.[] | select(.title == "Excluded crates report") | .number' | head -n 1 || true)"
  if [[ -n "$issue_number" ]]; then
    if ! gh issue edit "$issue_number" --body "$ISSUE_BODY"; then
      echo "Warning: unable to update the tracking issue." >&2
    fi
  else
    if ! gh issue create --title "$ISSUE_TITLE" --body "$ISSUE_BODY"; then
      echo "Warning: unable to create the tracking issue." >&2
    fi
  fi
else
  echo "Warning: gh CLI not available; skipping issue update." >&2
fi

echo "Generated excluded-crates report at $TARGET_DIR/report.md"
