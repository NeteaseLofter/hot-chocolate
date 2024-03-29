const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  mode: 'development',
  entry: {
    index: './src/index.jsx',
  },
  devServer: {
    contentBase: './dist',
    hot: false,
    open: false,
    port: 9528,
    headers:{"Access-Control-Allow-Origin":'*'},
    host: 'localhost'
  },
  devtool: "eval-source-map",
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
      {
        test: /\.js|jsx$/, use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        },
        exclude: /node_modules/
      }
    ],
  },
};