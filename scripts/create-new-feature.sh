#!/bin/bash

# Script to create a new feature branch and spec file
# Usage: ./scripts/create-new-feature.sh --json "feature description"

set -e

# Parse arguments
FEATURE_DESCRIPTION=""
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            FEATURE_DESCRIPTION="$2"
            shift 2
            ;;
        *)
            FEATURE_DESCRIPTION="$1"
            shift
            ;;
    esac
done

if [[ -z "$FEATURE_DESCRIPTION" ]]; then
    echo "Error: Feature description is required"
    exit 1
fi

# Generate branch name from feature description
BRANCH_NAME="feature/$(echo "$FEATURE_DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')"

# Ensure we're in the repo root
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# Create and checkout the new branch
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Create specs directory if it doesn't exist
mkdir -p specs

# Generate spec file path
SPEC_FILE="$REPO_ROOT/specs/${BRANCH_NAME#feature/}.md"

# Create empty spec file
touch "$SPEC_FILE"

# Output results
if [[ "$JSON_OUTPUT" == true ]]; then
    echo "{\"BRANCH_NAME\":\"$BRANCH_NAME\",\"SPEC_FILE\":\"$SPEC_FILE\"}"
else
    echo "Branch: $BRANCH_NAME"
    echo "Spec file: $SPEC_FILE"
fi