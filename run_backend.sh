#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting MarketScout Agent Backend Setup..."

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed. Please install it and try again."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run the backend
echo "⚡ Starting the FastAPI server..."

# Set PYTHONPATH to the backend directory so 'app' can be found
export PYTHONPATH=$PYTHONPATH:.

python app/main.py