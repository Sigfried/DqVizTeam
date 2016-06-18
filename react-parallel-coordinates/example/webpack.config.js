var webpack = require('webpack');
var babelSettings = {// Options to configure babel with
	//plugins: ['transform-runtime'],
	presets: ['es2015', 'stage-0', 'react']
};

module.exports = {
  devtool: 'source-map', //devtool: 'eval',
  //devtool: 'source-map',
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './example/index.js'
  ],
  output: {
    path: __dirname + '/scripts/',
    filename: 'bundle.js',
    publicPath: 'http://localhost:3000/scripts/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  resolve: {
    extensions: ['', '.js', '.json']
  },
  stats: {
    colors: true
  },
  eslint: {
    //configFile: '.eslintrc'
  },
  browser: {
	  fs: false
  },
  node: {
	  fs: "empty"
  },
  module: {

    loaders: [
      { test: /\.js$/, exclude: /(node_modules|bower_components|3rd-party)/, loaders: ['react-hot', 'jsx', 'babel?'+JSON.stringify(babelSettings)]},
      { test: /\.css$/, loader: "style!css" },
	  { test: /\.json$/, loader: 'json'},
      { test: /\.tsv$/, include: /data/, loader: "dsv-loader" }
    ],
	  preLoaders: [
			//{ test: /\.jsx$/, loader: 'eslint', exclude: /node_modules/ }
		],
  }
};
