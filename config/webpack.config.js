/**
 * External dependencies
 */
const BrowserSyncPlugin = require( 'browser-sync-webpack-plugin' );
const ESLintPlugin = require( 'eslint-webpack-plugin' );
const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const StyleLintPlugin = require( 'stylelint-webpack-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const WebpackBar = require( 'webpackbar' );
const WebpackRTLPlugin = require( 'webpack-rtl-plugin' );
const fastGlob = require( 'fast-glob' );
const path = require( 'path' );
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const { default: ImageminPlugin } = require( 'imagemin-webpack-plugin' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );

/**
 * Internal dependencies
 */
const CleanExtractedDeps = require( '../utils/clean-extracted-deps' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

const {
	fromConfigRoot,
	hasBabelConfig,
	hasPostCSSConfig,
	getPackageProp,
	hasEslintConfig,
	hasStylelintConfig,
} = require( '../utils' );

const defaultTargets = [
	'> 1%',
	'Firefox ESR',
	'last 2 versions',
	'not ie <= 11',
	'not ie_mob <=11',
];
const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';
const target = `browserslist:${ defaultTargets.join( ', ' ) }`;
const devURL = getPackageProp( 'devURL' );

const getCSSLoaders = ( isProd ) => {
	return [
		{
			loader: MiniCSSExtractPlugin.loader,
		},
		{
			loader: require.resolve( 'css-loader' ),
			options: {
				sourceMap: ! isProd,
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

const config = {
	devtool: isProduction ? false : 'source-map',
	mode,
	target,
	entry: {
		...fastGlob
			.sync(
				path.resolve(
					process.cwd(),
					`./assets/(js|css|blocks)/!(*.min.*|*.map|_*)(*.js|*.jsx|*.css|*.scss)`
				)
			)
			.reduce( ( memo, entry ) => {
				const file = path.relative(
					path.resolve( process.cwd(), `./assets/` ),
					entry
				);
				const name = file
					.replace( path.extname( entry ), '' )
					.replace( /[^A-Za-z0-9/\s!?]/g, '-' )
					.toLowerCase();

				return {
					...memo,
					[ name ]: entry,
				};
			}, {} ),
	},
	output: {
		clean: true,
		path: path.resolve( process.cwd(), `./assets/dist` ),
		chunkFilename: '[name].[contenthash].chunk.js',
		filename: '[name].js',
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js', '.jsx', '.json', '.scss', '.css' ],
		alias: {
			'lodash-es': 'lodash',
		},
	},
	externals: {
		jquery: 'jQuery',
		lodash: 'lodash',
		$: 'jQuery',
	},
	performance: {
		maxAssetSize: ( isProduction ? 100 : 10000 ) * 1024,
		maxEntrypointSize: ( isProduction ? 400 : 40000 ) * 1024,
		hints: 'warning',
	},
	stats: {
		// Copied from `'minimal'`.
		all: false,
		errors: true,
		modules: true,
		warnings: true,
		children: false,
		// Our additional options.
		assets: true,
		errorDetails: true,
		excludeAssets: /\.(jpe?g|png|gif|svg|woff|woff2)$/i,
		moduleTrace: true,
		performance: true,
	},
	optimization: {
		concatenateModules: isProduction && ! process.env.WP_BUNDLE_ANALYZER,
		splitChunks: {
			cacheGroups: {
				style: {
					type: 'css/mini-extract',
					test: /[\\/](\.module)?\.(sc|sa|c)ss$/,
					chunks: 'all',
					enforce: true,
					name( module, chunks, cacheGroupKey ) {
						return `${ cacheGroupKey }-${ chunks[ 0 ].name }`;
					},
				},
				default: false,
			},
		},
		minimizer: [
			new TerserPlugin( {
				parallel: true,
				terserOptions: {
					parse: {
						// We want terser to parse ecma 8 code. However, we don't want it
						// to apply any minification steps that turns valid ecma 5 code
						// into invalid ecma 5 code. This is why the 'compress' and 'output'
						// sections only apply transformations that are ecma 5 safe
						// https://github.com/facebook/create-react-app/pull/4234
						ecma: 8,
					},
					compress: {
						ecma: 5,
						warnings: false,
						// Disabled because of an issue with Uglify breaking seemingly valid code:
						// https://github.com/facebook/create-react-app/issues/2376
						// Pending further investigation:
						// https://github.com/mishoo/UglifyJS2/issues/2011
						comparisons: false,
						// Disabled because of an issue with Terser breaking valid code:
						// https://github.com/facebook/create-react-app/issues/5250
						// Pending futher investigation:
						// https://github.com/terser-js/terser/issues/120
						inline: 2,
						passes: 2,
					},
					output: {
						comments: /translators:/i,
					},
					mangle: {
						reserved: isProduction
							? []
							: [ '__', '_n', '_nx', '_x' ],
						safari10: true,
					},
				},
			} ),
		],
	},
	module: {
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
			{
				test: /\.svg$/,
				issuer: /\.(j|t)sx?$/,
				use: [ '@svgr/webpack', 'url-loader' ],
				type: 'javascript/auto',
			},
			{
				test: /\.svg$/,
				issuer: /\.(sc|sa|c)ss$/,
				type: 'asset/inline',
			},
			{
				test: /\.(bmp|png|jpe?g|gif)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'images/[name].[hash:8][ext]',
				},
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'fonts/[name].[hash:8][ext]',
				},
			},
		].filter( Boolean ),
	},
	plugins: [
		new ESLintPlugin( {
			failOnError: false,
			fix: true,
			...( ! hasEslintConfig() && {
				exclude: [
					'/assets/dist/',
					`/node_modules/`,
					`/vendor/`,
					'/assets/lib/',
				],
				overrideConfigFile: fromConfigRoot( '.eslintrc.js' ),
			} ),
		} ),
		// During rebuilds, all webpack assets that are not used anymore will be
		// removed automatically. There is an exception added in watch mode for
		// fonts and images. It is a known limitations:
		// https://github.com/johnagan/clean-webpack-plugin/issues/159
		new CleanWebpackPlugin( {
			cleanAfterEveryBuildPatterns: [ '!fonts/**', '!images/**' ],
			// Prevent it from deleting webpack assets during builds that have
			// multiple configurations returned to the webpack config.
			cleanStaleWebpackAssets: false,
		} ),
		new WebpackRTLPlugin( {
			filename: [ /(\.css)/i, '-rtl$1' ],
		} ),
		// The WP_BUNDLE_ANALYZER global variable enables a utility that represents
		// bundle content as a convenient interactive zoomable treemap.
		process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),

		// MiniCSSExtractPlugin to extract the CSS thats gets imported into JavaScript.
		new MiniCSSExtractPlugin( {
			//esModule: false,
			filename: () => {
				return '[name].css';
			},
			chunkFilename: '[id].css',
		} ),
		// Copy static assets to the `dist` folder.
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: '**/*.{jpg,jpeg,png,gif,svg}',
					to: 'images/[name].[ext]',
					noErrorOnMissing: true,
					context: path.resolve( process.cwd(), './assets/images' ),
				},
			],
		} ),
		// Compress images
		// Must happen after CopyWebpackPlugin
		new ImageminPlugin( {
			disable: ! isProduction,
			test: /\.(jpe?g|png|gif|svg)$/i,
		} ),

		! isProduction &&
			devURL &&
			new BrowserSyncPlugin(
				{
					host: 'localhost',
					port: 3000,
					proxy: devURL,
					open: false,
					files: [ '**/*.php', '**/*.js', 'dist/**/*.css' ],
					ignore: [ 'dist/**/*.php', 'dist/**/*.js' ],
					serveStatic: [ '.' ],
				},
				{
					injectCss: true,
					reload: false,
				}
			),

		// Lint CSS
		// new StyleLintPlugin({
		// 	context: path.resolve(process.cwd(), `./assets/css`),
		// 	files: '**/*.(s(c|a)ss|css)',
		// 	allowEmptyInput: true,
		// 	...(!hasStylelintConfig() && {
		// 		configFile: fromConfigRoot('.stylelintrc.json'),
		// 	}),
		// }),
		// Fancy WebpackBar.
		new WebpackBar(),
		// WP_NO_EXTERNALS global variable controls whether scripts' assets get
		// generated, and the default externals set.
		! process.env.WP_NO_EXTERNALS &&
			new DependencyExtractionWebpackPlugin(),
		new CleanExtractedDeps(),
		new RemoveEmptyScriptsPlugin(),
	].filter( Boolean ),
};

// console.log(config);
module.exports = config;
