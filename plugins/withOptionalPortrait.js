const { withAndroidManifest } = require('expo/config-plugins');

// Locking the activity to portrait makes Android imply a *required*
// android.hardware.screen.portrait feature, which hides the app on Google Play for
// tablets, Chromebooks and XR devices. Declare it optional so every device can install.
const FEATURE = 'android.hardware.screen.portrait';

module.exports = function withOptionalPortrait(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const features = (manifest['uses-feature'] || []).filter((f) => f.$['android:name'] !== FEATURE);
    features.push({ $: { 'android:name': FEATURE, 'android:required': 'false' } });
    manifest['uses-feature'] = features;
    return cfg;
  });
};
