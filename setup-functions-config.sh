#!/bin/bash

echo "🔧 Setting up Firebase Functions Configuration"
echo "============================================="
echo ""
echo "You need to set your API keys. Please have them ready:"
echo "1. OpenAI API Key (from https://platform.openai.com/api-keys)"
echo "2. Spoonacular API Key (from https://spoonacular.com/food-api/console#Dashboard)"
echo ""
echo "If you don't have these keys yet:"
echo "- OpenAI: Sign up at https://platform.openai.com"
echo "- Spoonacular: Sign up at https://spoonacular.com/food-api"
echo ""
read -p "Press Enter when you have your API keys ready..."

echo ""
read -p "Enter your OpenAI API Key: " OPENAI_KEY
read -p "Enter your Spoonacular API Key: " SPOONACULAR_KEY

echo ""
echo "Setting Firebase Functions configuration..."

firebase functions:config:set openai.api_key="$OPENAI_KEY"
firebase functions:config:set spoonacular.api_key="$SPOONACULAR_KEY"

echo ""
echo "✅ Configuration set! Now deploying functions..."
echo ""

firebase deploy --only functions 