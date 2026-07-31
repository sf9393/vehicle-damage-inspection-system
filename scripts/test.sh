#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python_bin="${PYTHON_BIN:-python3}"
venv_dir="$project_root/.venv"

if [[ ! -x "$venv_dir/bin/python" ]]; then
  "$python_bin" -m venv "$venv_dir"
fi

"$venv_dir/bin/python" -m pip install --quiet --upgrade pip
"$venv_dir/bin/python" -m pip install --quiet -r "$project_root/api/requirements-test.txt"
"$venv_dir/bin/python" -m unittest discover -s "$project_root/tests" -p "test_*.py" -v
"$venv_dir/bin/python" -m py_compile "$project_root/api/main.py"

echo "API tests and syntax checks passed."
