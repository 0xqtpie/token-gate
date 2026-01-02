#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
EXTENSION_DIR="$PROJECT_ROOT/packages/extension"
OUTPUT_DIR="$PROJECT_ROOT/dist"
OUTPUT_FILE="$OUTPUT_DIR/tokengate-extension.zip"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           TokenGate Extension Packager                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

mkdir -p "$OUTPUT_DIR"

if [ -f "$OUTPUT_FILE" ]; then
    rm "$OUTPUT_FILE"
    echo "→ Removed existing package"
fi

cd "$EXTENSION_DIR"

FILES_TO_INCLUDE=(
    "manifest.json"
    "background.js"
    "content.js"
    "utils.js"
    "popup.html"
    "popup.js"
    "popup.css"
    "options.html"
    "options.js"
    "options.css"
    "blocked.css"
    "icons/"
)

echo "→ Packaging extension files..."

zip -r "$OUTPUT_FILE" "${FILES_TO_INCLUDE[@]}" -x "*.DS_Store" -x "*Thumbs.db"

FILESIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')

echo ""
echo "✓ Package created successfully!"
echo ""
echo "  Output: $OUTPUT_FILE"
echo "  Size:   $FILESIZE"
echo ""
echo "Upload this ZIP to the Chrome Web Store Developer Dashboard."
