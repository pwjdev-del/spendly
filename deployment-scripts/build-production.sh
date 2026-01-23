#!/bin/bash

echo "🚀 Starting production build for AWS Elastic Beanstalk..."

# 1. Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next
rm -rf standalone
rm -f spendly-deploy.zip

# 2. Build the app
echo "🏗️  Building Next.js app..."
npm install
npm run build

# 3. Prepare standalone directory
echo "📦 Preparing deployment package..."
# 'standalone' folder is created by Next.js in .next/standalone
# We need to copy public/ and static/ assets to it for it to work correctly

mkdir -p .next/standalone/public
mkdir -p .next/standalone/.next/static

cp -r public/* .next/standalone/public/
cp -r .next/static/* .next/standalone/.next/static/

# 4. Create zip file
echo "🤐 Zipping payload..."
cd .next/standalone
zip -r ../../spendly-deploy.zip .

echo "✅ SUCCESS! Deployment package created: spendly-deploy.zip"
echo "👉 Upload this file to AWS Elastic Beanstalk."
