var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
	entry: './app/index.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
			{ test: /\.css/, use: ExtractTextPlugin.extract({ fallback: "style-loader", use: "css-loader" }) }
		]
	},
	devtool: 'source-map',
	plugins: [
		new HtmlWebpackPlugin({ template: 'app/index.html' }),
		new ExtractTextPlugin("styles.css")
	]
};
