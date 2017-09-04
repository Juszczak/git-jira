const path = require('path');
const webpack = require('webpack');

module.exports = {
  target: 'node',
  entry: {
    'prepare-commit-msg': path.resolve(__dirname, './src/prepare-commit-msg.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: `[name].js`,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [path.resolve(__dirname, './node_modules')],
  },
  resolveLoader: {
    modules: [path.resolve(__dirname, './node_modules')],
  },
  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'ts-loader',
      options: {silent: true},
    },
    ],
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: false,
      sourceMap: false,
    }),
  ]
};
