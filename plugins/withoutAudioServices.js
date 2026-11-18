const { withAndroidManifest } = require('expo/config-plugins');

// expo-audio's library manifest declares two foreground services (lock-screen media
// controls and background recording). This app never uses either, but their presence
// makes Google Play ask for a foreground-service declaration. Strip them at merge time.
const SERVICES = [
  'expo.modules.audio.service.AudioControlsService',
  'expo.modules.audio.service.AudioRecordingService',
];

module.exports = function withoutAudioServices(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';
    const app = manifest.application[0];
    const services = (app.service || []).filter((s) => !SERVICES.includes(s.$['android:name']));
    for (const name of SERVICES) {
      services.push({ $: { 'android:name': name, 'tools:node': 'remove' } });
    }
    app.service = services;
    return cfg;
  });
};
