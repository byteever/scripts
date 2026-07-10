/**
 * External dependencies
 */
const path = require( 'path' );
const WebpackBar = require( 'webpackbar' );
const MomentTimezoneDataPlugin = require( 'moment-timezone-data-webpack-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );

/**
 * Internal dependencies
 */
const RtlChunkCleanupPlugin = require( '../plugins/rtl-chunk-cleanup' );
const ScriptExternalsPlugin = require( '../plugins/script-externals' );
const TextDomainPlugin = require( '../plugins/textdomain-plugin' );
const { SOURCE_DIR, OUTPUT_DIR } = require( '../utils' );

// Set env vars before loading @wordpress/scripts config, which eagerly
// evaluates getWebpackEntryPoints() and reads these at require time.
if ( ! process.env.WP_SOURCE_PATH ) {
	process.env.WP_SOURCE_PATH = SOURCE_DIR;
}
if ( ! process.env.WP_COPY_PHP_FILES_TO_DIST ) {
	process.env.WP_COPY_PHP_FILES_TO_DIST = 'true';
}

/**
 * WordPress dependencies — must be loaded AFTER setting defaults above.
 * @wordpress/scripts/config/webpack.config eagerly calls getWebpackEntryPoints()
 * which reads process.env.WP_SOURCE_PATH to resolve the source directory.
 */
const baseConfig = require( '@wordpress/scripts/config/webpack.config' );

const ROOT_PATH = process.cwd();
const SOURCE_PATH = path.resolve( ROOT_PATH, process.env.WP_SOURCE_PATH );
const OUTPUT_PATH = path.resolve( ROOT_PATH, OUTPUT_DIR );

module.exports = {
	...baseConfig,
	entry: {
		...( typeof baseConfig.entry === 'function'
			? baseConfig.entry()
			: baseConfig.entry ),
	},
	output: {
		...baseConfig.output,
		path: OUTPUT_PATH,
		chunkFilename: 'chunks/[name].js',
		enabledLibraryTypes: [ 'window', 'commonjs' ],
	},
	resolve: {
		...baseConfig.resolve,
		modules: [
			path.join( ROOT_PATH, 'node_modules' ),
			path.join( SOURCE_PATH, 'node_modules' ),
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
				common: {
					chunks: 'async',
					minChunks: 2,
					minSize: 200 * 1024,
					name: false,
					priority: 5,
				},
				styles: {
					type: 'css/mini-extract',
					chunks: 'all',
					enforce: true,
					priority: 10,
					minChunks: 2,
					name: false,
				},
			},
		},
	},
	plugins: [
		...baseConfig.plugins.filter( ( p ) => {
			const exclude = [
				'MiniCssExtractPlugin',
				'DependencyExtractionWebpackPlugin',
			];
			return ! exclude.includes( p?.constructor?.name );
		} ),

		/**
		 * Extended dependency extraction that handles custom script externals.
		 * Reads externals from webpack config and generates correct handles in .asset.php.
		 *
		 * @see ../plugins/script-externals.js
		 */
		new ScriptExternalsPlugin(),

		/**
		 * Replace 'byteever' text domains in PHP vendor files and JS assets.
		 * Auto-detects text domain from package.json (textDomain → name → folder).
		 *
		 * @see ../plugins/textdomain-plugin.js
		 */
		new TextDomainPlugin(),

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
		...( () => {
			const Plugin = baseConfig.plugins.find(
				( p ) => p?.constructor?.name === 'MiniCssExtractPlugin'
			)?.constructor;
			return Plugin
				? [
						new Plugin( {
							filename: '[name].css',
							chunkFilename: 'chunks/[name].css',
						} ),
				  ]
				: [];
		} )(),

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
};
