const path = require('path');

module.exports = {
    entry: {
        popup: './popup.js',
        content: './content.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        fallback: {
            "fs": false,
            "path": false
        }
    }
}; 