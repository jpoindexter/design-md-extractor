#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: extract-website-style.sh <url> <out-dir>" >&2
  exit 2
fi

design-md-extractor extract "$1" --out "$2"
