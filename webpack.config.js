"use strict";

const slsw = require("serverless-webpack");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");

function babelLoader() {
  const plugins = [
    "@babel/plugin-transform-runtime",
    "@babel/plugin-proposal-class-properties",
    "babel-plugin-source-map-support",
  ];

  return {
    loader: "babel-loader",
    options: {
      cacheDirectory: true,
      cacheCompression: false,
      plugins: plugins.map(plugin => require.resolve(plugin)),
      presets: [
        [
          require.resolve("@babel/preset-env"),
          {
            targets: {
              node: Number.parseInt(
                slsw.lib.serverless.service.provider.runtime.replace(
                  "nodejs",
                  "",
                ),
                10,
              ),
            },
          },
        ],
      ],
    },
  };
}

function plugins() {
  const plugins = [
    new HardSourceWebpackPlugin({
      info: {
        mode: "none",
        level: "error",
      },
    }),
  ];

  return plugins;
}

module.exports = {
  entry: slsw.lib.entries,
  target: "node",
  context: __dirname,
  stats: "errors-only",
  devtool: "source-map",
  // Exclude "aws-sdk" since it's a built-in package
  externals: ["aws-sdk", "oax"],
  mode: "production",
  performance: {
    // Turn off size warnings for entry points
    hints: false,
  },
  resolve: {
    // Performance
    // symlinks: false,
    // First start by looking for modules in the plugin's node_modules
    // before looking inside the project's node_modules.
    modules: ["node_modules"],
  },
  // Add loaders
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [babelLoader()],
      },
    ],
  },
  // PERFORMANCE ONLY FOR DEVELOPMENT
  optimization: {
    minimize: false,
  },
  plugins: plugins(),
};
