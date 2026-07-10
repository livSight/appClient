const fs = require("fs");

const IS_STAGING = process.env.APP_VARIANT === "staging";

/**
 * google-services.json is gitignored, so EAS builds never see the local file.
 * Resolution order:
 *   1. GOOGLE_SERVICES_JSON — EAS file secret (env var holds the uploaded file path)
 *   2. ./google-services.json — local dev builds
 *   3. absent — build without FCM push on Android
 */
function resolveGoogleServicesFile() {
  if (process.env.GOOGLE_SERVICES_JSON) return process.env.GOOGLE_SERVICES_JSON;
  if (fs.existsSync("./google-services.json")) return "./google-services.json";
  return undefined;
}

module.exports = ({ config }) => {
  const googleServicesFile = resolveGoogleServicesFile();
  const android = { ...config.android };
  if (googleServicesFile) {
    android.googleServicesFile = googleServicesFile;
  } else {
    delete android.googleServicesFile;
  }

  return {
    ...config,
    name: IS_STAGING ? "livsight Staging" : config.name,
    scheme: IS_STAGING ? "livsight-staging" : config.scheme,
    android: {
      ...android,
      // Staging installs side-by-side with production on the same device.
      package: IS_STAGING ? `${android.package}.staging` : android.package,
    },
  };
};
