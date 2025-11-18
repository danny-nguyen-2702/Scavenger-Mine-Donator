#!/bin/bash

# Scavenger Mine Donation Tool Setup Script
# This script sets up the environment for running the donation tool

echo "🚀 Scavenger Mine Donation Tool Setup"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js version 16 or higher."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully"
echo ""

# Check if donor_wallets.csv exists
if [ ! -f "donor_wallets.csv" ]; then
    echo "❌ donor_wallets.csv file not found. Please create donor_wallets.csv manually."
    echo "   See README.md for the required format."
else
    echo "✅ donor_wallets.csv already exists"
fi

echo ""
echo "====================================="
echo "✅ Setup complete!"
echo ""
echo "To run the donation tool, use one of these commands:"
echo "  npm start"
echo "  node donator.js"
echo ""
echo "Make sure to:"
echo "1. Edit donor_wallets.csv with your actual data"
echo "2. Ensure all donor addresses are registered with Scavenger Mine"
echo "3. Have a stable internet connection"
echo ""
echo "Results will be saved to: donation_results_timestamp.xlsx"
echo "====================================="