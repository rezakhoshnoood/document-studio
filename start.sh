#!/usr/bin/env bash
# Start from this folder, bind first, then open the browser.
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  exec python3 serve.py "${1:-18798}"
fi
echo "Python 3 is required."
exit 1
