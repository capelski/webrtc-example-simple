const { merge } = require('webpack-merge');
const baseConfig = require('./base.config');

module.exports = merge(baseConfig, {
    mode: 'development',
    devServer: {
        historyApiFallback: {
            index: '/webrtc-example-simple',
        },
        open: '/webrtc-example-simple',
    },
});
