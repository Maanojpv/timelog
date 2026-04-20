# iOS Deployment via Xcode for Timelog App

This guide walks through building and shipping the Timelog app using **Xcode** on a Mac, after the JavaScript/Expo project is ready.

**Identifiers used by this project (from `app.json`):**

| Item | Value |
|------|--------|
| Bundle ID | `com.manoj.timelogapp` |
| Marketing version | `expo.version` (e.g. `1.0.0`) |
| iOS build number | `expo.ios.buildNumber` (string, must increase each upload) |

The generated Xcode workspace is typically under `ios/` (e.g. `timelogapp.xcworkspace`).

---

## Part A — Before you build (every release)

### 1. Apple Developer prerequisites

1. **Apple Developer Program** membership (paid), enrolled and active.
2. **App record** exists in [App Store Connect](https://appstoreconnect.apple.com) for bundle ID `com.manoj.timelogapp`.
3. **Signing:**
   - In Xcode → **Settings → Accounts**, your Apple ID is added.
   - The app uses a **Distribution** certificate and **App Store** provisioning profile.

### 2. Bump versions in `app.json`

For **every** new binary you upload:

1. **`expo.version`** — User-facing version (e.g. `1.0.0`, `1.1.0`).
2. **`expo.ios.buildNumber`** — Must be **strictly greater** than the last build uploaded (e.g. if the last build was `1`, use `"2"`).

Apple rejects duplicate or lower build numbers.

### 3. Install dependencies and verify TypeScript

From the repository root:

```bash
npm install
npx tsc --noEmit
```

Fix any TypeScript errors before archiving.

### 4. Generate or refresh the `ios/` project (`expo prebuild`)

```bash
npx expo prebuild --platform ios
cd ios && pod install && cd ..
```

**Important:**
- **First time:** `prebuild` creates `ios/`.
- **Later:** `prebuild` may **overwrite** parts of `ios/`.
- Always open the **`.xcworkspace`** file, **not** the `.xcodeproj`.

---

## Part B — Xcode: clean state (recommended before Archive)

### 1. Close Xcode

Quit Xcode completely.

### 2. Optional: clear Derived Data (strong clean)

1. Xcode → **Settings** → **Locations**.
2. Click the **arrow** next to **Derived Data** to open the folder in Finder.
3. Delete the subfolder for this project.

### 3. Optional: clean inside Xcode

1. Open `ios/*.xcworkspace`.
2. Menu **Product → Clean Build Folder** (hold **Option** if you only see "Clean").

---

## Part C — Xcode: scheme, device, signing

### 1. Open the workspace

```bash
open ios/*.xcworkspace
```

### 2. Select the app scheme

In the toolbar, choose the **Timelog** app scheme (not a Pod scheme).

### 3. Select a real archive destination

For **Archive**, choose **Any iOS Device** or a **generic iOS Device** — not a simulator.

### 4. Signing & Capabilities

1. Select the **project** in the navigator, then the **app target**.
2. **Signing & Capabilities** tab:
   - **Team:** Your Apple Developer team.
   - **Bundle Identifier:** Must be `com.manoj.timelogapp`.
   - Enable **Automatically manage signing**.

### 5. Version and build (should match `app.json`)

In the target **General** tab:
- **Version** should match `expo.version`.
- **Build** should match `expo.ios.buildNumber`.

---

## Part D — Archive, validate, upload

### 1. Archive

1. Menu **Product → Archive**.
2. Wait for the build to finish. The **Organizer** window opens.

### 2. Distribute

1. Select the new archive → **Distribute App**.
2. Choose **App Store Connect** → **Upload**.
3. Follow the wizard.
4. Wait until the upload **succeeds**.

### 3. Processing on App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → your app → **TestFlight** or **App Store** tab.
2. Wait until the build finishes **Processing** (can take 10–30+ minutes).

---

## Part E — Attach build to a version and submit

### 1. Create or select the app version

1. **App Store** tab → **iOS App** → **+** **Version** or select your new marketing version.
2. Complete **What's New in This Version** and screenshots/metadata.

### 2. Select the build

Under **Build**, click **+** and choose the uploaded build.

### 3. Submit for review

1. Answer **Export compliance**, **Advertising**, **Content rights**, etc.
2. **Submit for Review**.

---

## Part F — Troubleshooting (common)

| Symptom | What to try |
|--------|-------------|
| "No signing certificate" | Xcode → Accounts → Download manual profiles; check Team. |
| Duplicate build number | Increase `expo.ios.buildNumber` in `app.json`, `prebuild` again. |
| Pod errors after pull | `cd ios && pod install --repo-update`. |
| Wrong bundle ID | Must be `com.manoj.timelogapp` everywhere; fix `app.json`. |
| Archive is grayed out | Destination must not be a simulator; pick **Any iOS Device**. |

---

## Quick command reference (repo root)

| Goal | Command |
|------|---------|
| Deps + typecheck | `npm install && npx tsc --noEmit` |
| Full iOS native prep | `npx expo prebuild --platform ios && cd ios && pod install && cd ..` |
| Pods only | `cd ios && pod install` |
| Open Xcode workspace | `open ios/*.xcworkspace` |

---

## Related doc

- **[iOS Deployment Setup](ios-deployment-setup.md)** — Initial setup and Bundle ID generation.
- **[Installing the App](installing-the-app.md)** — How users install your app.
