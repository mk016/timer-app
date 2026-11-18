#!/bin/bash
set -e

echo "🚀 Starting Local Android Release AAB Build..."

export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

cd android
./gradlew bundleRelease

echo "✅ BUILD SUCCESSFUL!"
echo "📍 Your release AAB file is generated at:"
echo "$(pwd)/app/build/outputs/bundle/release/app-release.aab"
