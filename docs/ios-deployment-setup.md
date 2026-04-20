# iOS Deployment Setup for Timelog App

This guide walks through setting up your Timelog app for iOS deployment, including generating a Bundle ID and preparing for App Store submission.

## Step 1: Choose Your Bundle ID

**What is a Bundle ID?**
A Bundle ID is a unique identifier for your app on the App Store. It follows reverse domain name notation.

**Suggested Bundle ID for Timelog:**
```
com.manoj.timelogapp
```

**Alternative options:**
- `com.yourname.timelog` (replace with your actual name)
- `com.yourcompany.timelog` (if you have a company)

## Step 2: Update app.json with Bundle ID

Add the Bundle ID to your `app.json`:

```json
{
  "expo": {
    "name": "Timelog",
    "slug": "timelogapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "owner": "your-apple-developer-email@example.com",
    "ios": {
      "bundleIdentifier": "com.manoj.timelogapp",
      "supportsTablet": true,
      "buildNumber": "1"
    },
    "android": {
      "package": "com.manoj.timelogapp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

## Step 3: Apple Developer Account Setup

### Prerequisites
1. **Apple Developer Program** membership ($99/year)
2. **Mac computer** with Xcode installed
3. **iOS device** for testing (recommended)

### Actions
1. Sign in to [Apple Developer Portal](https://developer.apple.com)
2. Go to **Certificates, Identifiers & Profiles**
3. Select **Identifiers** and click **+**
4. Choose **App IDs** and click **Continue**
5. Enter **Description**: "Timelog App"
6. Enter **Bundle ID**: `com.manoj.timelogapp` (your chosen ID)
7. Select the capabilities your app needs:
   - ✅ **Push Notifications** (if you plan to add notifications)
   - ✅ **Associated Domains** (if you plan to add deep linking)
   - ✅ **In-App Purchase** (if you plan to add paid features)
8. Click **Continue** then **Register**

## Step 4: Create Development Certificate

### For Development
1. In **Certificates, Identifiers & Profiles**, go to **Certificates**
2. Click **+** and select **Apple Development**
3. Follow the instructions to create a CSR (Certificate Signing Request)
4. Upload the CSR and download the certificate
5. Double-click to install in Keychain Access

### For Distribution (App Store)
1. Repeat the process but select **Apple Distribution**
2. This certificate is used for App Store submissions

## Step 5: Create Provisioning Profiles

### Development Profile
1. Go to **Profiles** section
2. Click **+** and select **iOS App Development**
3. Choose your app ID (com.manoj.timelogapp)
4. Select your development certificate
5. Choose your testing devices
6. Name it: "Timelog Dev Profile"
7. Download and install

### Distribution Profile
1. Click **+** and select **App Store**
2. Choose your app ID
3. Select your distribution certificate
4. Name it: "Timelog App Store Profile"
5. Download and install

## Step 6: Update Your Local Project

Run these commands to generate the native iOS project:

```bash
# Install dependencies
npm install

# Generate iOS project
npx expo prebuild --platform ios

# Install iOS dependencies
cd ios && pod install && cd ..
```

## Step 7: Configure Xcode Project

1. Open the workspace: `open ios/timelogapp.xcworkspace`
2. Select your project in the navigator
3. Go to **Signing & Capabilities** tab
4. Ensure:
   - **Team**: Your Apple Developer team
   - **Bundle Identifier**: `com.manoj.timelogapp`
   - **Provisioning Profile**: Automatically selected or choose manually

## Next Steps

After completing these steps:

1. **Test on Device**: Connect your iPhone and run the app
2. **Prepare App Store Assets**: Create app screenshots and metadata
3. **Build for App Store**: Archive and upload via Xcode

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No matching provisioning profile" | Ensure Bundle ID matches exactly in app.json and Apple Developer portal |
| "Certificate expired" | Create new certificate and update provisioning profiles |
| "Device not registered" | Add your device UDID to the development profile |
| "Bundle ID already taken" | Choose a different Bundle ID or claim the existing one if it's yours |

---

**Related Documentation:**
- [iOS Xcode Deployment](ios-xcode-deployment.md) - Building and uploading to App Store
- [Installing the App](installing-the-app.md) - How users install your app
