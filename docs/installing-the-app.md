# Installing the Timelog App (new users & updates)

This document describes how **end users** and **testers** install the Timelog app after it is published. It does **not** replace developer setup; for building from source, see **[iOS Xcode deployment](ios-xcode-deployment.md)**.

**App identifiers:**

| Platform | ID |
|----------|-----|
| iOS bundle ID | `com.manoj.timelogapp` |
| Android package | `com.manoj.timelogapp` |

Store listing name and icon may differ; users should rely on the **official listing** from your team.

---

## 1. Installing from the Apple App Store (production)

For **new users** and **updates** once the app is **live** on the App Store.

### Requirements

- **iPhone or iPad** with a compatible **iOS version** (check your App Store Connect listing for minimum iOS).
- **Apple ID** signed in on the device (Settings → Apple ID).
- **Internet** (Wi‑Fi or cellular).

### Steps — new install

1. Open the **App Store** app on the device.
2. Tap the **Search** tab (magnifying glass).
3. Type **"Timelog"** or your **developer name** as shown on the store listing.
4. Find the correct app (verify **developer name** and **icon**).
5. Tap **GET** or the **price** button, then authenticate (Face ID, Touch ID, or password).
6. Wait for the download and installation to finish.
7. Tap **OPEN** from the App Store, or find the app **icon on the Home Screen** and tap it.

### Steps — updating an existing install

1. When a **new version** is available, the App Store shows an **UPDATE** button on the app's page.
2. Alternatively: **App Store** → tap your **profile picture** (top right) → **Upcoming Automatic Updates** / **Available Updates** → find the app → **UPDATE**.

Automatic updates can be enabled in **Settings → App Store → App Updates**.

### First launch permissions

On first open (or after an update that adds features), iOS may ask for:

- **Notifications** — if the app uses time tracking reminders, choose **Allow** or **Don't Allow**.
- **Local Storage** — the app stores time logs locally on your device.

Users can change these later in **Settings → Timelog**.

---

## 2. Installing from TestFlight (beta / internal testing)

Use this path for **pre-release builds** distributed through **TestFlight** (common for QA and stakeholders).

### Requirements

- **TestFlight** app from the App Store (free).
- **Invitation** from the developer:
  - **Public link**, or  
  - **Email invite** to the tester's Apple ID, or  
  - **Internal tester** (App Store Connect team member).

### Steps — first-time TestFlight user

1. Install **TestFlight** from the App Store if prompted.
2. Open the **invite email** or **public link** on the iPhone/iPad.
3. Tap **View in TestFlight** or **Start Testing**.
4. TestFlight opens → tap **Accept**, then **Install** next to the Timelog app.
5. When the app appears on the Home Screen, open it like any other app.

### Steps — updating a TestFlight build

1. Open **TestFlight**.
2. Under the app, tap **Update** when a new build is available.

TestFlight builds **expire** after a period (typically **90 days**). Users must install a newer build or wait for the App Store release.

### Feedback

Testers can send **screenshots and crash feedback** from TestFlight if the developer enables it.

---

## 3. Installing from Google Play (Android)

Use when the Android app is published on **Google Play**.

### Requirements

- Device with **Google Play** and a **Google account**.
- Compatible **Android version** (see Play listing).

### Steps — new install

1. Open the **Play Store** app.
2. Search for **"Timelog"** or **developer**.
3. Tap **Install**.
4. Tap **Open** when ready.

### Steps — update

1. Play Store → **Manage apps & device** → **Updates available**, or open the app's store page and tap **Update**.

### Permissions

Android shows permission prompts at install or runtime (e.g. **notifications**, **storage**). Users can adjust them in **Settings → Apps → Timelog → Permissions**.

---

## 4. "App not found" or wrong app

- Confirm the **official name** ("Timelog"), **developer**, and **store region**.
- **TestFlight** builds are **not** on the public App Store; use the **TestFlight** link or email.
- If the app is **not yet released** in a region, the store may hide it.

---

## 5. Data Backup & Sync

**Important:** The Timelog app stores time tracking data locally on your device.

### iOS Backup
- Your data is included in **iCloud backups** if you have iCloud Backup enabled.
- **Manual backup**: Before switching devices, ensure your data is backed up.

### Data Migration
- When upgrading to a new device, restore from an **iCloud backup** to preserve your time logs.
- **Note:** Uninstalling the app without a backup will **permanently delete** all time logs.

---

## 6. Uninstall / reinstall

### iOS

- Long-press the app icon → **Remove App** → **Delete App**.  
- Reinstall from **App Store** → **cloud icon** or search again.

**Warning:** Local time log data will be removed on uninstall unless you have an iCloud backup.

### Android

- **Settings → Apps → Timelog → Uninstall**, or long-press icon → **Uninstall**.  
- Reinstall from Play Store.

---

## 7. Getting Help

If you encounter issues:

1. **Check permissions**: Ensure the app has necessary permissions in Settings.
2. **Restart the app**: Close and reopen the app.
3. **Update**: Ensure you have the latest version from the App Store/Play Store.
4. **Contact support**: Reach out through the app's support channels.

---

## Related doc

- **[iOS Xcode deployment](ios-xcode-deployment.md)** — Developer steps to build, archive, and submit updates.
- **[iOS Deployment Setup](ios-deployment-setup.md)** — Initial setup and Bundle ID generation.
