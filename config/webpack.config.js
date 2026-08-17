/**
 * External dependencies
 */
const path = require( 'path' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );

/**
 * Internal dependencies
 */
const DropAsyncChunkRtlPlugin = require( '../plugins/drop-async-chunk-rtl' );
const ScriptExternalsPlugin = require( '../plugins/script-externals' );
const TextDomainPlugin = require( '../plugins/textdomain-plugin' );
const { getPackageOption, resolveFromProjectRoot } = require( '../utils' );

// @wordpress/scripts reads this at require time; CLI flags win over defaults.
if ( ! process.env.WP_COPY_PHP_FILES_TO_DIST ) {
	process.env.WP_COPY_PHP_FILES_TO_DIST = 'true';
}

/**
 * WordPress dependencies — loaded after the env default above.
 */
const baseConfig = require( resolveFromProjectRoot(
	'@wordpress/scripts/config/webpack.config',
) );

const ROOT_PATH = process.cwd();

/**
 * Entries declared in package.json under byteever.entries — a string path,
 * or a webpack entry descriptor for producers exposing a shared library.
 */
const entries = Object.fromEntries(
	Object.entries( getPackageOption( 'byteever.entries', {} ) ).map( ( [ name, file ] ) => [
		name,
		typeof file === 'string'
			? path.resolve( ROOT_PATH, file )
			: { ...file, import: path.resolve( ROOT_PATH, file.import ) },
	] ),
);

/**
 * Apply the ByteEver conventions to one base config.
 *
 * The base export is a single config, or [ scripts, modules ] when script
 * modules are enabled; the module half keeps its own entries and externals.
 *
 * @param {Object} config Base webpack config to customize.
 * @return {Object} The customized config.
 */
const customize = ( config ) => {
	/**
	 * Extract CSS chunks next to the script chunks.
	 */
	const miniCss = config.plugins?.find(
		( plugin ) => 'MiniCssExtractPlugin' === plugin?.constructor?.name,
	);
	if ( miniCss ) {
		miniCss.options.chunkFilename = 'chunks/[name].css?ver=[contenthash]';
	}

	/**
	 * Hoist code shared by two or more async chunks into one common chunk.
	 *
	 * wp-scripts sets `cacheGroups.default` to false, so nothing is hoisted and
	 * a module reached by ten lazy routes is emitted ten times. The scope is
	 * `async` because WordPress enqueues one script handle per entry: splitting
	 * an initial chunk emits a file nothing enqueues, while an async chunk is
	 * fetched by webpack's own loader. `name: false` keeps chunk filenames
	 * numeric — generated names break WordPress.org deployment.
	 */
	if ( ! config.output?.module ) {
		config.optimization = {
			...config.optimization,
			splitChunks: {
				...config.optimization?.splitChunks,
				name: false,
				cacheGroups: {
					...config.optimization?.splitChunks?.cacheGroups,
					common: {
						chunks: 'async',
						minChunks: 2,
						minSize: 0,
						reuseExistingChunk: true,
						priority: 10,
					},
				},
			},
		};
	}

	const base = {
		...config,
		output: {
			...config.output,
			chunkFilename: 'chunks/[name].js?ver=[chunkhash]',
		},
		plugins: [
			...( config.plugins || [] ),

			/**
			 * Replace text domains in PHP vendor files and JS assets.
			 * Auto-detects text domain from package.json (textDomain → name → folder).
			 *
			 * @see ../plugins/textdomain-plugin.js
			 */
			new TextDomainPlugin( {
				textdomain: getPackageOption(
					[ 'byteever.i18n.textdomain', 'name' ],
					'',
				),
				updateDomains: getPackageOption(
					'byteever.i18n.updateDomains',
					[ 'byteever' ],
				),
				include: getPackageOption( 'byteever.i18n.include', [
					'vendor/byteever',
				] ),
				exclude: getPackageOption( 'byteever.i18n.exclude', [] ),
			} ),

			/**
			 * Drop the -rtl.css files emitted for async chunks — WordPress
			 * only swaps enqueued styles to -rtl, never runtime-loaded chunks.
			 *
			 * @see ../plugins/drop-async-chunk-rtl.js
			 */
			new DropAsyncChunkRtlPlugin(),
		],
		stats: {
			all: false,
			errors: true,
			errorDetails: true,
			warnings: true,
			assets: true,
			colors: true,
			timings: true,
		},
	};

	if ( config.output?.module ) {
		return base;
	}

	return {
		...base,
		output: {
			...base.output,

			/*
			 * @wordpress/scripts disables clean under --experimental-modules so
			 * the two compilations cannot wipe each other. Only this half emits
			 * chunks/, and those names are content-hashed, so stale ones would
			 * otherwise ship forever.
			 */
			clean: { keep: ( asset ) => ! asset.startsWith( 'chunks/' ) },
		},
		entry: {
			...( typeof config.entry === 'function'
				? config.entry()
				: config.entry ),
			...entries,
		},
		externals: {
			...base.externals,
			...getPackageOption( 'byteever.externals', {} ),
		},
		plugins: [
			...base.plugins.filter(
				( plugin ) =>
					'DependencyExtractionWebpackPlugin' !==
					plugin?.constructor?.name,
			),

			/**
			 * Extended dependency extraction that handles custom script externals.
			 * Reads externals from webpack config and generates correct handles in .asset.php.
			 *
			 * @see ../plugins/script-externals.js
			 */
			! process.env.WP_NO_EXTERNALS && new ScriptExternalsPlugin(),

			/**
			 * Remove empty scripts emitted for CSS-only entry points.
			 *
			 * @see https://www.npmjs.com/package/webpack-remove-empty-scripts
			 */
			new RemoveEmptyScriptsPlugin( {
				stage: RemoveEmptyScriptsPlugin.STAGE_AFTER_PROCESS_PLUGINS,
				remove: /\.js$/,
			} ),
		],
	};
};

const configs = (
	Array.isArray( baseConfig ) ? baseConfig : [ baseConfig ]
).map( customize );

module.exports = Array.isArray( baseConfig ) ? configs : configs[ 0 ];
