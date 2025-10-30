/**
 * External dependencies
 */
const path = require('path');
const { merge } = require('webpack-merge');
const WebpackBar = require('webpackbar');
const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RtlChunkCleanupPlugin = require('../plugins/rtl-chunk-cleanup');

/**
 * Internal dependencies
 */
const { hasArgInCLI } = require('../utils');

process.env.WP_COPY_PHP_FILES_TO_DIST = true;
if (!hasArgInCLI('--source-path')) {
	process.env.WP_SOURCE_PATH = 'assets/src';
}
if (!hasArgInCLI('--output-path')) {
	process.env.WP_OUTPUT_PATH = 'assets/build';
}

/**
 * Create optimized Webpack config extending @wordpress/scripts.
 * Processes assets, packages, and applies performance optimizations.
 *
 * @param {Object}          baseConfig - WordPress base Webpack config (required).
 * @param {Object|Function} [overrides] - Extra entries object OR a function(config) => partialConfig.
 * @return {Object} Enhanced Webpack configuration object.
 * @throws {Error} When baseConfig is invalid.
 *
 * @example
 * module.exports = createConfig(wpConfig, { 'app': './assets/src/app.js' });
 * module.exports = createConfig(wpConfig, (config) => ({ devtool: 'source-map' }));
 */
const createConfig = (baseConfig, overrides ) => {
	if (!baseConfig || typeof baseConfig !== 'object') {
		throw new Error(
			'A valid @wordpress/scripts config must be passed as the first argument.'
		);
	}

	const ROOT_PATH    = process.cwd();
	const CONTEXT_PATH = baseConfig.context || ROOT_PATH;
	const SOURCE_PATH  = path.resolve(CONTEXT_PATH, process.env.WP_SOURCE_PATH || 'src');
	const OUTPUT_PATH  = path.resolve(CONTEXT_PATH, process.env.WP_OUTPUT_PATH || 'build');


	process.env.WP_SOURCE_PATH = path.relative(ROOT_PATH, SOURCE_PATH);

	let config = {
		...baseConfig,
		entry: {
			...( typeof baseConfig.entry === 'function' ? baseConfig.entry() : baseConfig.entry ),
			...( ( typeof overrides === 'object' && !Array.isArray(overrides) ) ? overrides : {} ),
		},
		output: {
			...baseConfig.output,
			path: path.resolve( OUTPUT_PATH ),
			chunkFilename: 'chunks/[name].js',
			enabledLibraryTypes: [ 'window', 'commonjs' ],
		},
		resolve: {
			...baseConfig.resolve,
			modules: [
				path.join( ROOT_PATH, 'node_modules' ),
				path.join( SOURCE_PATH, 'node_modules' )
			],
		},
		externals: {
			...baseConfig.externals,
			lodash: 'lodash',
			jquery: 'jQuery',
			$: 'jQuery',
		},
		stats: {
			all: false,
			errors: true,
			warnings: true,
			assets: true,
			colors: true,
			builtAt: false,
			timings: true,
			version: false,
		},
		optimization: {
			...baseConfig.optimization,
			splitChunks: {
				...baseConfig.optimization.splitChunks,
				cacheGroups: {
					...baseConfig.optimization.splitChunks.cacheGroups,
					styles: {
						type: 'css/mini-extract',
						chunks: 'all',
						enforce: true,
						priority: 10,
						minChunks: 2,
						name: false,
					}
				},
			},
		},
		plugins: [
			...baseConfig.plugins.filter((p) => p && p.constructor && p.constructor.name !== 'MiniCssExtractPlugin').filter(Boolean),

			/**
			 * Copy source files/directories to a build directory.
			 *
			 * @see https://www.npmjs.com/package/copy-webpack-plugin
			 */
			new CopyWebpackPlugin( {
				patterns: [
					{
						from: 'images/**/*.{jpg,jpeg,png,gif,svg}',
						to: 'images/[name][ext]',
						context: SOURCE_PATH,
						noErrorOnMissing: true,
					},
					{
						from: 'fonts/**/*.{woff,woff2,eot,ttf,otf,css}',
						context: SOURCE_PATH,
						noErrorOnMissing: true,
					},
				]
			} ),

			/**
			 * Reduces data for moment-timezone.
			 *
			 * @see https://www.npmjs.com/package/moment-timezone-data-webpack-plugin
			 */
			new MomentTimezoneDataPlugin( {
				startYear: 2000,
			} ),

			/**
			 * Remove empty scripts.
			 *
			 * @see https://www.npmjs.com/package/webpack-remove-empty-scripts
			 */
			new RemoveEmptyScriptsPlugin( {
				stage: RemoveEmptyScriptsPlugin.STAGE_AFTER_PROCESS_PLUGINS,
				remove: /\.(js)$/,
			} ),

			/**
			 * Extract CSS into separate files with chunk CSS emitted to chunks/.
			 * Replaces WordPress's default to add chunkFilename configuration.
			 *
			 * @see https://github.com/webpack-contrib/mini-css-extract-plugin
			 */
			new MiniCssExtractPlugin({ filename: '[name].css', chunkFilename: 'chunks/[name].css' }),

			/**
			 * Removes RTL CSS files generated for chunks.
			 * WordPress's RtlCssPlugin creates RTL for all CSS, but we only want it for entry points.
			 */
			new RtlChunkCleanupPlugin(),

			/**
			 * Show progressbar for cleaner build output.
			 *
			 * @see https://github.com/unjs/webpackbar
			 */
			new WebpackBar(),
		],
	}

	if ( typeof overrides === 'function' ) {
		const customConfig = overrides(config);
		if ( typeof customConfig !== 'object' || customConfig === null ) {
			throw new Error('Override function must return a valid config object.');
		}
		config = merge(config, customConfig);
	}
	return config;
};

module.exports = createConfig;
