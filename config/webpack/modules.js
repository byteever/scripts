/**
 * External dependencies
 */
const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );

/**
 * Internal dependencies
 */
const {
	hasBabelConfig,
	hasPostCSSConfig,
	fromConfigRoot,
} = require( '../../utils' );

const getCSSLoaders = ( isProduction ) => {
	return [
		{
			loader: MiniCSSExtractPlugin.loader,
		},
		{
			loader: require.resolve( 'css-loader' ),
			options: {
				sourceMap: ! isProduction,
				modules: {
					auto: true,
				},
			},
		},
		{
			loader: require.resolve( 'postcss-loader' ),
			options: {
				postcssOptions: {
					// Provide a fallback configuration if there's not
					// one explicitly available in the project.
					...( ! hasPostCSSConfig() && {
						config: fromConfigRoot( 'postcss.config.js' ),
					} ),
				},
			},
		},
	].filter( Boolean );
};

module.exports = ( { isProduction, isPackage } ) => {
	return {
		rules: [
			{
				// Match all js/jsx/ts/tsx files except TS definition files
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: [
					require.resolve( 'thread-loader' ),
					{
						loader: require.resolve( 'babel-loader' ),
						options: {
							// Babel uses a directory within local node_modules
							// by default. Use the environment variable option
							// to enable more persistent caching.
							cacheDirectory:
								process.env.BABEL_CACHE_DIRECTORY || true,

							// Provide a fallback configuration if there's not
							// one explicitly available in the project.
							...( ! hasBabelConfig() && {
								babelrc: false,
								configFile: false,
								presets: [
									require.resolve(
										'@wordpress/babel-preset-default'
									),
								],
							} ),
						},
					},
				],
			},
			{
				test: /\.svg$/,
				use: [ '@svgr/webpack', 'url-loader' ],
			},
			{
				test: /\.css$/,
				use: getCSSLoaders( isProduction ),
			},
			{
				test: /\.(sc|sa)ss$/,
				use: [
					...getCSSLoaders( isProduction ),
					{
						loader: require.resolve( 'sass-loader' ),
						options: {
							sourceMap: ! isProduction,
						},
					},
				],
			},
			// when in package module only include referenced resources
			isPackage && {
				test: /\.(woff(2)?|ttf|eot|svg|jpg|jpeg|png|giff|webp)(\?v=\d+\.\d+\.\d+)?$/,
				type: 'asset/resource',
			},
		].filter( Boolean ),
	};
};
