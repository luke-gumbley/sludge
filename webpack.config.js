import path from 'path';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
	mode: 'development',
	entry: './app/index.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(import.meta.dirname, 'dist')
	},
	module: {
		rules: [
			{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
			{ test: /\.css$/, use: [ MiniCssExtractPlugin.loader, "css-loader" ] }
		]
	},
	devtool: 'source-map',
	plugins: [
		new HtmlWebpackPlugin({ template: 'app/index.html' }),
		new MiniCssExtractPlugin({filename: "[name].css",chunkFilename: "[id].css"})
	]
};
