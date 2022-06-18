
const path = require('path')

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'worker.mjs',
    path: path.join(__dirname, 'dist'),
    library: {
      type: 'module',
    },
  },
  devtool: 'cheap-module-source-map',
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          // transpileOnly is useful to skip typescript checks occasionally:
          // transpileOnly: true,
        },
      },
    ],
  },
  experiments: {
    outputModule: true,
  },
  optimization: {
    minimize: false,
  },
}