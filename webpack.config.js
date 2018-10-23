var IgnorePlugin = require('webpack').IgnorePlugin
var join = require('path').join

module.exports = {
    plugins: [
        new IgnorePlugin(/aws-sdk/)
    ],
    entry: './main.js',
    target: 'node',
    output: {
        filename: 'bundle.js',
    },
    resolveLoader: {
        alias: {
            "sqlite3-rewrite-loader": join(__dirname, "./sqlite3-rewrite-loader.js")
        }
    },
    module: {
        loaders: [
            { test: /\.node$/, loader: "xbin-loader" },
            { test: /node-pre-gyp/, loader: 'null-loader' },
            { test: /sqlite3.js/, loader: 'sqlite3-rewrite-loader' }
        ]
    }
}