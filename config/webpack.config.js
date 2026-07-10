/**
 * External dependencies
 */
const path = require( 'path' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );

/**
 * Internal dependencies
 */
const ScriptExternalsPlugin = require( '../plugins/script-externals' );
const TextDomainPlugin = require( '../plugins/textdomain-plugin' );
const { getPackageOption, SOURCE_DIR, OUTPUT_DIR } = require( '../utils' );

// @wordpress/scripts reads these at require time; CLI flags win over defaults.
if ( ! process.env.WP_SOURCE_PATH ) {
	process.env.WP_SOURCE_PATH = SOURCE_DIR;
}
if ( ! process.env.WP_COPY_PHP_FILES_TO_DIST ) {
	process.env.WP_COPY_PHP_FILES_TO_DIST = 'true';
}

/**
 * WordPress dependencies — loaded after the env defaults above.
 */
const baseConfig = require( '@wordpress/scripts/config/webpack.config' );

const ROOT_PATH = process.cwd();
const OUTPUT_PATH = path.resolve( ROOT_PATH, OUTPUT_DIR );

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
	] )
);

/**
 * Apply the ByteEver conventions to one base config.
 *
 * The base export is a single config, or [ scripts, modules ] when script
 * modules are enabled; the module half keeps its own entries and externals.
 */
const customize = ( config ) => {
	/**
	 * Extract CSS chunks next to the script chunks.
	 */
	const miniCss = config.plugins?.find(
		( plugin ) => 'MiniCssExtractPlugin' === plugin?.constructor?.name
	);
	if ( miniCss ) {
		miniCss.options.chunkFilename = 'chunks/[name].css';
	}

	const base = {
		...config,
		output: {
			...config.output,
			path: OUTPUT_PATH,
			chunkFilename: 'chunks/[name].js',
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
					''
				),
				updateDomains: getPackageOption(
					'byteever.i18n.updateDomains',
					[ 'byteever' ]
				),
				include: getPackageOption( 'byteever.i18n.include', [
					'vendor/byteever',
				] ),
				exclude: getPackageOption( 'byteever.i18n.exclude', [] ),
			} ),
		],
		stats: {
			all: false,
			errors: true,
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
		output: {
			...base.output,
			enabledLibraryTypes: [ 'window' ],
		},
		plugins: [
			...base.plugins.filter(
				( plugin ) =>
					'DependencyExtractionWebpackPlugin' !==
					plugin?.constructor?.name
			),

			/**
			 * Extended dependency extraction that handles custom script externals.
			 * Reads externals from webpack config and generates correct handles in .asset.php.
			 *
			 * @see ../plugins/script-externals.js
			 */
			new ScriptExternalsPlugin(),

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
