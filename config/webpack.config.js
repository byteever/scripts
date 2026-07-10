/**
 * External dependencies
 */
const path = require( 'path' );
const WebpackBar = require( 'webpackbar' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );

/**
 * Internal dependencies
 */
const ScriptExternalsPlugin = require( '../plugins/script-externals' );
const TextDomainPlugin = require( '../plugins/textdomain-plugin' );
const { getPackageProp, SOURCE_DIR, OUTPUT_DIR } = require( '../utils' );

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
const settings = getPackageProp( 'byteever' ) || {};

/**
 * Apply the ByteEver conventions to one base config.
 *
 * The base export is a single config, or [ scripts, modules ] when script
 * modules are enabled; the module half keeps its own entries and externals.
 */
const customize = ( config ) => {
	const isModule = !! config.output?.module;
	const entry = config.entry;
	const plugins = [ ...( config.plugins || [] ) ];

	const miniCss = plugins.find(
		( plugin ) => 'MiniCssExtractPlugin' === plugin?.constructor?.name
	);
	if ( miniCss ) {
		miniCss.options.chunkFilename = 'chunks/[name].css';
	}

	if ( ! isModule ) {
		const dewp = plugins.findIndex(
			( plugin ) =>
				'DependencyExtractionWebpackPlugin' ===
				plugin?.constructor?.name
		);
		if ( -1 !== dewp ) {
			/**
			 * Extended dependency extraction that handles custom script externals.
			 * Reads externals from webpack config and generates correct handles in .asset.php.
			 *
			 * @see ../plugins/script-externals.js
			 */
			plugins.splice( dewp, 1, new ScriptExternalsPlugin() );
		}

		/**
		 * Remove empty scripts emitted for CSS-only entry points.
		 *
		 * @see https://www.npmjs.com/package/webpack-remove-empty-scripts
		 */
		plugins.push(
			new RemoveEmptyScriptsPlugin( {
				stage: RemoveEmptyScriptsPlugin.STAGE_AFTER_PROCESS_PLUGINS,
				remove: /\.js$/,
			} )
		);
	}

	/**
	 * Replace 'byteever' text domains in PHP vendor files and JS assets.
	 * Auto-detects text domain from package.json (textDomain → name → folder).
	 *
	 * @see ../plugins/textdomain-plugin.js
	 */
	plugins.push( new TextDomainPlugin() );

	/**
	 * Show progressbar for cleaner build output.
	 *
	 * @see https://github.com/unjs/webpackbar
	 */
	plugins.push(
		new WebpackBar( { name: isModule ? 'modules' : 'scripts' } )
	);

	return {
		...config,
		...( isModule
			? {}
			: {
					entry: () => {
						const entries = {
							...( typeof entry === 'function'
								? entry()
								: entry ),
						};

						for ( const [ name, extra ] of Object.entries(
							settings.entries || {}
						) ) {
							entries[ name ] =
								typeof extra === 'string'
									? path.resolve( ROOT_PATH, extra )
									: {
											...extra,
											import: path.resolve(
												ROOT_PATH,
												extra.import
											),
									  };
						}

						return entries;
					},
					externals: {
						...config.externals,
						...( settings.externals || {} ),
					},
			  } ),
		output: {
			...config.output,
			path: OUTPUT_PATH,
			...( isModule
				? {}
				: {
						chunkFilename: 'chunks/[name].js',
						enabledLibraryTypes: [ 'window' ],
				  } ),
		},
		plugins,
		stats: {
			all: false,
			errors: true,
			warnings: true,
			assets: true,
			colors: true,
			timings: true,
		},
	};
};

// Always an array: [ scripts ] or [ scripts, modules ]. Consumers map over it.
module.exports = (
	Array.isArray( baseConfig ) ? baseConfig : [ baseConfig ]
).map( customize );
