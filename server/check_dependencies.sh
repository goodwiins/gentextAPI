#!/bin/bash

set -e

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
cd $TEMP_DIR

echo "Creating a virtual environment to test dependencies..."
python3 -m venv test_env
source test_env/bin/activate

echo "Installing pip-tools..."
pip install pip-tools

echo "Checking requirements.txt for compatibility..."
# Copy requirements.txt to temp dir
cp /app/requirements.txt .

# Try to compile requirements using pip-tools
echo "Compiling requirements to check compatibility..."
if ! pip-compile --verbose requirements.txt -o compiled_requirements.txt 2>&1; then
    echo "❌ Dependencies have conflicts. Please fix requirements.txt before proceeding."
    exit 1
fi

echo "✅ Dependencies appear to be compatible!"
echo "You can proceed with your deployment."

# Clean up
deactivate
cd - > /dev/null
rm -rf $TEMP_DIR 