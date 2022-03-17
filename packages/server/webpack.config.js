const nodeExternals = require("webpack-node-externals");

const dist = `${__dirname}/dist`;

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/typescript"],
              plugins: [
                [
                  "babel-plugin-module-resolver",
                  {
                    root: ["./src"],
                    alias: {
                      common: "../../packages/common/src",
                    },
                  },
                ],
                "@babel/plugin-transform-runtime",
                "babel-plugin-transform-typescript-metadata",
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                "@babel/plugin-proposal-class-properties",
                "@babel/plugin-proposal-object-rest-spread",
                "@babel/plugin-proposal-optional-chaining",
                "@babel/plugin-transform-typescript",
              ],
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  externalsPresets: { node: true },
  externals: [
    nodeExternals({
      allowlist: /^common/,
    }),
  ],
  mode: "development",
  devtool: "source-map",
  entry: "./src/index.ts",
  target: "node",
  output: {
    filename: "index.js",
    libraryTarget: "commonjs2",
    path: dist,
  },
};
