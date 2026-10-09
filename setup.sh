#!/bin/bash

# ============================================================================
# Student Placement Prediction Web App - Setup Script
# ============================================================================

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║  🚀 Student Placement Prediction - Web Application Setup              ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check Python installation
echo "📋 Checking system requirements..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✓ Python $PYTHON_VERSION found"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."

if [ -d "venv" ]; then
    echo "Virtual environment already exists. Skipping..."
else
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "🔧 Activating virtual environment..."

if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "❌ Failed to activate virtual environment"
    exit 1
fi

# Upgrade pip
echo ""
echo "📥 Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
echo ""
echo "📚 Installing dependencies from requirements.txt..."

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo "✓ Dependencies installed successfully"
else
    echo "❌ requirements.txt not found"
    exit 1
fi

# Check for model and data files
echo ""
echo "🔍 Checking for model and data files..."

if [ -f "1788760215317_placement_prediction_model.pkl" ]; then
    echo "✓ Model file found"
else
    echo "⚠️  Model file not found: 1788760215317_placement_prediction_model.pkl"
fi

if [ -f "1788760215316_Indian_Student_Placement_Dataset.csv" ]; then
    echo "✓ Dataset file found"
else
    echo "⚠️  Dataset file not found: 1788760215316_Indian_Student_Placement_Dataset.csv"
fi

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."

mkdir -p templates
mkdir -p static
echo "✓ Directories created"

# Check if main.py exists
echo ""
echo "🔎 Checking application files..."

if [ -f "main.py" ]; then
    echo "✓ main.py found"
else
    echo "❌ main.py not found"
    exit 1
fi

if [ -f "templates/index.html" ]; then
    echo "✓ HTML template found"
else
    echo "❌ HTML template not found"
    exit 1
fi

if [ -f "static/style.css" ]; then
    echo "✓ CSS file found"
else
    echo "❌ CSS file not found"
    exit 1
fi

if [ -f "static/script.js" ]; then
    echo "✓ JavaScript file found"
else
    echo "❌ JavaScript file not found"
    exit 1
fi

# Setup complete
echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Completed Successfully!                                     ║"
echo "╠════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                        ║"
echo "║  📍 To start the application, run:                                    ║"
echo "║                                                                        ║"
echo "║     python main.py                                                     ║"
echo "║                                                                        ║"
echo "║  🌐 Then open your browser and go to:                                 ║"
echo "║                                                                        ║"
echo "║     http://localhost:5000                                              ║"
echo "║                                                                        ║"
echo "║  📚 For more information, see README.md                                ║"
echo "║                                                                        ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""
