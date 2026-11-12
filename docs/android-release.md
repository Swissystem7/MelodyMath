# Android release (Google Play)

MelodyMath on the web is the installable app. Google Play should wrap that live site in a Trusted Web Activity (Bubblewrap), not ship another frozen copy of the files.

The debug APK on the GitHub release `v1.0.0-android` is not that wrapper. Do not upload it.

Nothing in this repository is a signing key, a Play Console account, or a published listing. Those stay with the owner.

## What `v1.0.0-android` actually is

Release: `https://github.com/Swissystem7/MelodyMath/releases/tag/v1.0.0-android`

The `MelodyMath.apk` asset was uploaded at `2026-10-12T23:13:47Z`. The release page itself was published earlier that week, before this binary was attached.

The APK is a small Kotlin WebView shell:

- Package id `com.swissystem.melodymath`, versionName `1.0.0`, activity `com.swissystem.melodymath.MainActivity`.
- Built with Android Gradle Plugin 8.5.2.
- Signed with the well-known **Android debug** certificate (`CN=Android Debug, O=Android, C=US`), created the same minute as the upload (`notBefore` `2026-10-12 23:13:17Z`). Play does not accept that certificate. There is no release key in this repo.
- It is not Capacitor and not Bubblewrap. The classes have no Capacitor package and no `androidbrowserhelper` / Trusted Web Activity. `MainActivity` loads `file:///android_asset/www/index.html` through `androidx.webkit.WebViewAssetLoader` (`appassets.androidplatform.net`).
- `assets/www` matches git commit `27f66919302fb81cee74168a45df8feec3356bff` (2026-10-13, service worker `melodymath-offline-v15`) after normalizing CRLF. 47 files are identical; the two PNGs differ by one byte. The Android project that produced the APK was never committed. Current `master` is not that snapshot.

A Play update cannot be signed with the debug key. Treat `com.swissystem.melodymath` as a free package id (it was never a Play upload), and create a new upload key.

## Why a Trusted Web Activity

The site is static files. It does not need a native SDK. A Trusted Web Activity opens `https://swissystem7.github.io/MelodyMath/` in Chrome, so a Play update of the shell is rare and a site deploy reaches installed copies. Capacitor would mean another Android project and, unless it is pointed at the same URL, another snapshot like the debug APK. Use Capacitor only if a later version needs a native API Play's TWA does not cover.

Bubblewrap CLI **1.27.0** is the version these steps were checked against. Its template sets `targetSdkVersion 36` and `compileSdkVersion 36`. As of 31 August 2026, new Play apps must target Android 16 (API 36). Confirm the generated `app/build.gradle` still says `targetSdkVersion 36` before you upload. If a newer Bubblewrap drops below 36, set it back to 36 and rebuild.

`android/twa-manifest.json` is the config. Generated Gradle output, keystores, and bundles are gitignored.

## Digital Asset Links (required, and not served from this repo)

Play checks the **origin root**:

`https://swissystem7.github.io/.well-known/assetlinks.json`

That URL is the user site `https://github.com/Swissystem7/swissystem7.github.io`. It is not this project. A file committed here is published at `https://swissystem7.github.io/MelodyMath/.well-known/...`, which Play does not read. Today the origin-root URL returns 404.

`.well-known/assetlinks.json.example` is the shape. After you have the real SHA-256 fingerprints, add `.well-known/assetlinks.json` to the **user site repo** (create the `.well-known` directory there). Do not put the placeholder fingerprint on the live URL.

With Play App Signing, which new apps use, the fingerprint that must match is the **app signing** certificate from Play Console → Test and release → App signing. The upload keystore fingerprint is a different certificate. List both SHA-256 values in `sha256_cert_fingerprints` so verification succeeds for the signing key Play actually uses.

Check before submitting a release:

```bash
curl -sI https://swissystem7.github.io/.well-known/assetlinks.json
curl -s "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://swissystem7.github.io&relation=delegate_permission/common.handle_all_urls"
```

The first command must be HTTP 200 and `content-type` JSON. The second must list `com.swissystem.melodymath`.

A custom domain on the MelodyMath project is the other way to put `assetlinks.json` in this repo: a project site's custom domain is served from `/`, so `.well-known/assetlinks.json` here would be the origin root. That also changes the public URL. `host`, `startUrl`, and `fullScopeUrl` in `android/twa-manifest.json` would have to change with it. Domain registration is a separate cost. The github.io user site does not need one.

## Build, sign, and upload

1. Install JDK 17 and the Android SDK. The first `bubblewrap` run asks to install a JDK; JDK 17 is the one to use. Node 18 or newer is required (22 is what this repo tests with).

2. Create the upload keystore **on the owner's machine**. Do not commit it, and do not reuse the debug keystore that signed `MelodyMath.apk`.

   ```bash
   keytool -genkeypair -v \
     -keystore android.keystore -alias melodymath \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

   Put that file at `android/android.keystore` (the path in `twa-manifest.json` is `./android.keystore`, relative to `android/`). `*.keystore` is gitignored. Keep the passwords in a password manager.

3. Generate the Android project from the committed manifest. Run this after `icons/icon-maskable-512.png` is on GitHub Pages, because `maskableIconUrl` points at that file. `icon-512.png` is already there.

   ```bash
   cd android
   npx --yes @bubblewrap/cli@1.27.0 update --skipVersionUpgrade
   ```

   Confirm `app/build.gradle` contains `targetSdkVersion 36`.

4. Build the bundle. Passwords come from the environment, not from the repo.

   ```bash
   export BUBBLEWRAP_KEYSTORE_PASSWORD='the keystore password'
   export BUBBLEWRAP_KEY_PASSWORD='the key password'
   npx --yes @bubblewrap/cli@1.27.0 build
   ```

   Upload `app-release-bundle.aab`. `app-release-signed.apk` is only for a device you sideload onto. Each later upload needs a higher `appVersionCode` in `android/twa-manifest.json` (the first Play upload is `1`).

5. Fingerprints, then asset links, then the Play upload. Order matters: asset links must be live before review.

   ```bash
   keytool -list -v -keystore android.keystore -alias melodymath
   ```

   After the Play app exists, copy the app-signing SHA-256 from Play Console as well. Put the real values into the user site's `.well-known/assetlinks.json`, starting from `.well-known/assetlinks.json.example`. You can also record them with:

   ```bash
   npx --yes @bubblewrap/cli@1.27.0 fingerprint add "AA:BB:..." --name "Play app signing"
   ```

   That writes `assetlinks.json` in the current directory. Move that file to the user site repo. Do not commit the keystore next to it.

6. In Play Console, create the app with package name `com.swissystem.melodymath`. That id is permanent. Upload the `.aab` to an internal test track first.

   Store listing extras this repo does not invent for you:

   - Privacy policy URL: `https://swissystem7.github.io/MelodyMath/privacy.html`
   - Content rating, data safety, and target audience. The product is elementary practice, so the listing may include children. If it does, the Families policy applies (ads, data collection, the privacy policy). Data safety should match `privacy.html`: no account and no server, progress stays on the device. Confirm that against the build you upload.
   - New **personal** Play accounts have had to run a closed test (12 testers for 14 days) before production. Organization accounts differ and can require a D-U-N-S number. Use the rule Play Console shows for the account type you open.

7. Leave the web manifest's `prefer_related_applications` unset. Setting it to true tells Chrome to offer the Play app instead of installing the site, and it should wait until the listing is actually public.

## Account cost

Google Play Console is a **US$25 one-time** registration fee per developer account, not per app and not yearly. Google's current signup page is [Get started with Play Console](https://support.google.com/googleplay/android-developer/answer/6112435). The fee is not refunded if identity details are rejected. Prepaid cards are not accepted.

Opening the account, paying, and uploading are owner steps. This repository does not do them.

## iOS

Safari → Share → Add to Home Screen is the install path on iPhone and iPad. The pages carry `apple-touch-icon`, `apple-mobile-web-app-capable`, and `apple-mobile-web-app-title`, and the manifest is `lang: he`, `dir: rtl`. No Apple fee.

The App Store is separate. The Apple Developer Program is **US$99 per year**. A WebView shell of this site is the kind of app Guideline 4.2 (minimum functionality) rejects. This repo does not add a Capacitor or Xcode project. Add one only when there is a native feature that the Home Screen app cannot cover.

## What not to commit

- `android.keystore`, any `*.jks`, or the debug keystore that signed the old APK
- `BUBBLEWRAP_KEYSTORE_PASSWORD` and `BUBBLEWRAP_KEY_PASSWORD`
- A Play service-account JSON (`bubblewrap play` can upload; that JSON is a secret)
- The generated `android/app` project, the `.aab`, or the signed `.apk`
