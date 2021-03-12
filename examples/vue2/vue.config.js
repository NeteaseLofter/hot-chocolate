module.exports = {
  
    devServer: {
        contentBase: './dist',
        hot: true,
        port: 9529,
        headers:{"Access-Control-Allow-Origin":'*'},
        open: false
      },
}