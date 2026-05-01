#!/bin/bash
# Paper Prints - Dev launcher
# Sets up adb reverse tunnel so physical device can reach localhost backend

set -e

echo "📡 Setting up ADB reverse tunnel (port 3000)..."
adb reverse tcp:3000 tcp:3000
echo "✅ Tunnel active: phone's localhost:3000 → this machine's port 3000"

echo ""
echo "🚀 Starting Flutter..."
cd user-app && flutter run
