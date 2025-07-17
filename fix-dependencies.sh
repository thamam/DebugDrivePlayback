#!/bin/bash

echo "Fixing Node.js dependency conflicts..."

# Clean install with legacy peer deps
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

echo "Dependencies fixed. You can now run: npm run dev"