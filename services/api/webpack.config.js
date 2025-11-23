const webpack = require('webpack');

module.exports = function (options, webpack) {
  return {
    ...options,
    externals: {
      // Exclude bcrypt native module from webpack bundling
      bcrypt: 'commonjs bcrypt',
    },
    plugins: [
      ...options.plugins,
      // Ignore dynamic requires that cause issues
      new webpack.IgnorePlugin({
        resourceRegExp: /^mock-aws-s3$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^nock$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^aws-sdk$/,
      }),
    ],
    module: {
      ...options.module,
      rules: [
        ...options.module.rules,
        {
          test: /\.html$/,
          type: 'asset/source',
        },
      ],
    },
  };
};
