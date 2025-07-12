module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // plugins: [
    //   "nativewind/babel", // This line is crucial!
    //   "react-native-reanimated/plugin", // Often needed for navigation animations
    // ],
    //  plugins: [
    //   ["module:react-native-dotenv", {
    //     moduleName: "@env",
    //     path: ".env",
    //     blacklist: null,
    //     whitelist: null,
    //     safe: false,
    //     allowUndefined: true,
    //   }],
      // "react-native-reanimated/plugin", // Optional if you're using it
   // ],
  };
};
