#!/bin/bash

# Script to set up GitHub repository for EagleAI
# Run this script after creating the repository on GitHub

echo "🦅 EagleAI GitHub Setup"
echo "======================="
echo ""
echo "Step 1: Create a new repository on GitHub"
echo "  - Go to: https://github.com/new"
echo "  - Repository name: EagleAI"
echo "  - Description: AI-powered object detection and segmentation"
echo "  - Make it Public or Private (your choice)"
echo "  - DO NOT initialize with README, .gitignore, or license"
echo ""
echo "Step 2: After creating the repo, run these commands:"
echo ""
echo "# Initialize git (if not already done)"
echo "git init"
echo ""
echo "# Add all files"
echo "git add ."
echo ""
echo "# Make initial commit"
echo "git commit -m \"Initial commit: EagleAI - AI-powered vision analysis\""
echo ""
echo "# Add your GitHub repository as remote (replace YOUR_USERNAME)"
echo "git remote add origin https://github.com/YOUR_USERNAME/EagleAI.git"
echo ""
echo "# Push to GitHub"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "======================="
echo "✅ After running these commands, your code will be on GitHub!"


