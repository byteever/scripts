/**
 * External dependencies
 */
const path = require( 'path' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );

/**
 * Internal dependencies
 */
const BlocksManifestPlugin = require( '../plugins/blocks-manifest' );
const ScriptExternalsPlugin = require( '../plugins/script-externals' );
const TextDomainPlugin = require( '../plugins/textdomain-plugin' );
const { SOURCE_DIR, OUTPUT_DIR } = require( '../utils' );

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
 * Apply the ByteEver conventions to one base config.
 *
 * The base export is a single config, or [ scripts, modules ] when script
 * modules are enabled; the module half keeps its own entries and externals.
 */
const customize = ( config, overrides ) => {
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
		const manifest = plugins.findIndex(
			( plugin ) =>
				'BlocksManifestPlugin' === plugin?.constructor?.name
		);
		if ( -1 !== manifest ) {
			/**
			 * Generate the manifest inside the blocks directory.
			 *
			 * @see ../plugins/blocks-manifest.js
			 */
			plugins.splice( manifest, 1, new BlocksManifestPlugin() );
		}

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
							overrides.entry || {}
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
						...( overrides.externals || {} ),
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

/**
 * Build the webpack config with the plugin's overrides.
 *
 * Returns what webpack consumes — the config object, or the pair when
 * script modules are enabled — so consumers never branch on the shape.
 */
module.exports = ( overrides = {} ) => {
	const configs = (
		Array.isArray( baseConfig ) ? baseConfig : [ baseConfig ]
	).map( ( config ) => customize( config, overrides ) );

	return Array.isArray( baseConfig ) ? configs : configs[ 0 ];
};
