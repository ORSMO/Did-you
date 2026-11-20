# Google Play release checklist — Did You?

## Android build and identity

- [x] Native Android project created in `mobile/`
- [x] Android-only Expo config; **target API 36** through SDK 58
- [x] Configured EAS `preview` APK and `production` AAB profiles
- [x] GitHub Actions source and Android bundle check
- [ ] Confirm permanent package ID, currently **`com.orsmo.didyou`** (placeholder)
- [ ] Choose and install final high-resolution adaptive app icon and splash image
- [ ] Connect an Expo account, create/sign an APK, install and test on physical Android devices
- [ ] Create production AAB and validate app-signing fingerprint in Play Console

## Production foundation — required before public launch

- [ ] User authentication with email/Google (and account verification)
- [ ] Shared Postgres database; private answers enforced on the server
- [ ] Public, opt-in Dids, real story posts, threaded replies, real community stats
- [ ] Account/profile editing, uploaded images and cross-device syncing
- [ ] Abuse reports and flag reviews, content removals, block/mute, anti-spam/rate limits
- [ ] Moderation for serious/dark topics, appropriate age rules, appeal/contact channels
- [ ] Delete account and associated data in-app and via any required external mechanism
- [ ] Security testing, backup/restore, error tracking and performance monitoring
- [ ] Real-device accessibility checks and closed-beta testing

## Google Play Console

- [ ] Create app record for **Did You?**
- [ ] Store listing: 512×512 icon, 1024×500 feature graphic, Android phone screenshots, description, categorization and contact details
- [ ] Public privacy policy URL, accurate Data safety form and content-rating questionnaire
- [ ] App access instructions for reviewers if login is required
- [ ] Disclosures and controls required by Google Play user-generated-content policies
- [ ] Run an internal or closed test before production
- [ ] For **personal developer accounts created after November 13, 2023**, Google generally requires at least **12 opted-in testers for 14 consecutive days** before applying for production access (check your Console)
- [ ] Upload a signed **AAB**; complete review and staged rollout

## First test build steps

```bash
cd mobile
npm install
npx expo-doctor
npx eas-cli login
npx eas-cli build:configure -p android
npx eas-cli build --platform android --profile preview
```

**Builds and Play Console submission are not automatic yet.** An Expo account/signing credentials and Play Console actions are needed. Do not upload private keys to GitHub.
