var path = require('path');

module.exports = {
	entry: './app/index.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
			{ test: /\.css$/, loader: 'style-loader' },
			{ test: /\.css$/, loader: 'css-loader', query: { modules: true, localIdentName: '[local]' } }
		]
	},
	devtool: 'source-map'
};
