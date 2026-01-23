#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Client Dependencies and Build
echo "Installing Client Dependencies..."
cd client
npm install
echo "Building Client..."
npm run build
cd ..

# Install Server Dependencies
echo "Installing Server Dependencies..."
cd server
npm install
