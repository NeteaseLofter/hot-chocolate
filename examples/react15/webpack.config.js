const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  // mode: 'production',
  entry: {
    index: './src/index.js',
  },
  devServer: {
    contentBase: './dist',
    hot: true,
    port: 9528,
    headers:{"Access-Control-Allow-Origin":'*'}
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Development',
      template:'./src/index.html',
      minify: false,
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean:true,
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};