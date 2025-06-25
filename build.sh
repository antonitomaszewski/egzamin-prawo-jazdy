#!/bin/bash
echo "Installing Python packages..."

python3 -m venv venv
source venv/bin/activate
pip install -r ./data/requirements.txt

echo "Installing npm packages..."
npm install

echo "Installation complete."
