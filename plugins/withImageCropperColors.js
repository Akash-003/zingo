const { withAndroidColors, AndroidConfig } = require('@expo/config-plugins');

// expo-image-picker's Android crop screen (vanniktech/android-image-cropper,
// via ExpoCropImageActivity) defaults to a *transparent* toolbar with black
// icons/text (see node_modules/expo-image-picker/android/src/main/res/values/colors.xml)
// — against a photo that's often light in that region, Flip/Rotate/Crop read
// as invisible. The library exposes these exact color names as overridable
// Android resources; app-level resources win the merge over the library's
// defaults, so setting them here is enough — no native code, no fork.
const CROP_COLORS = {
  expoCropToolbarColor: '#E11D48', // Zingo rose, opaque
  expoCropToolbarIconColor: '#FFFFFF',
  expoCropToolbarActionTextColor: '#FFFFFF',
  expoCropBackButtonIconColor: '#FFFFFF',
  expoCropBackgroundColor: '#FFFFFF',
};

const withImageCropperColors = (config) =>
  withAndroidColors(config, (config) => {
    for (const [name, value] of Object.entries(CROP_COLORS)) {
      config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, { name, value });
    }
    return config;
  });

module.exports = withImageCropperColors;
