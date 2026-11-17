# Android APK build

OmniSim Studio uses Capacitor 8 to package the web application as an Android app.

## Automated build

Every push to `main` and every manual run of the **OmniSim Studio Android APK** workflow builds a debug APK on GitHub-hosted Ubuntu.

The workflow:

1. Installs the exact npm dependency lock.
2. Runs the TypeScript and Vite production build.
3. Generates the native Android project with Capacitor.
4. Copies the web build into the Android project.
5. Builds `app-debug.apk` with Gradle.
6. Verifies the APK signature and uploads the APK as a GitHub Actions artifact.

Open the repository's **Actions** tab, select **OmniSim Studio Android APK**, open the latest successful run, and download the artifact named `OmniSim-Studio-Android-APK`.

## APK type and signing

The automated artifact is a debug APK. Android signs it with the standard debug key so it can be installed for testing. It is not a Play Store release and does not use a permanent private release keystore.

A distributable release APK requires a private signing key. Store that key and its passwords in GitHub Actions secrets; never commit a keystore or its passwords to the repository. Keep the same release key for future app updates.

## Requirements

Capacitor 8 requires Node.js 22 or newer. Android builds use Java 21 and Android SDK platform 36. See the official [Capacitor Android guide](https://capacitorjs.com/docs/android) and [environment setup](https://capacitorjs.com/docs/getting-started/environment-setup).
