import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export default {
	mode: 'development',
	entry: './app/index.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(import.meta.dirname, 'dist/www')
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
