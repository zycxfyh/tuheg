#!/bin/bash

# 🔒 Creation Ring - Critical Files Protection Script
# This script ensures that critical project files are not accidentally deleted or modified

set -e

CRITICAL_FILES=(
    "repomix-output.xml"
    "README.md"
    "SECURITY-ANALYSIS-REPORT.md"
    "REPOMIX-README.md"
    "package.json"
    "pnpm-lock.yaml"
    ".gitignore"
    ".gitattributes"
)

echo "🔍 Checking critical files..."

MISSING_FILES=()
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    echo "❌ ERROR: Critical files are missing!"
    echo "Missing files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
    echo "⚠️  These files are essential for the project. Please restore them immediately."
    echo "   If you accidentally deleted them, check git history:"
    echo "   git log --name-only --oneline | grep -E '($(IFS=\|; echo "${CRITICAL_FILES[*]}"))'"
    exit 1
fi

# Special check for repomix-output.xml size
REPOMIX_FILE="repomix-output.xml"
if [ -f "$REPOMIX_FILE" ]; then
    FILE_SIZE=$(stat -f%z "$REPOMIX_FILE" 2>/dev/null || stat -c%s "$REPOMIX_FILE" 2>/dev/null || echo "0")
    MIN_SIZE=$((1024*1024)) # 1MB minimum

    if [ "$FILE_SIZE" -lt "$MIN_SIZE" ]; then
        echo "⚠️  WARNING: $REPOMIX_FILE seems too small (${FILE_SIZE} bytes)"
        echo "   Expected size: > ${MIN_SIZE} bytes (1MB+)"
        echo "   This file should contain the complete codebase. Please regenerate if needed."
        echo "   Run: repomix . --output repomix-output.xml"
    else
        echo "✅ $REPOMIX_FILE size check passed (${FILE_SIZE} bytes)"
    fi
fi

echo "✅ All critical files are present and accounted for."
echo "🛡️  Project integrity verified."
