/**
 * External dependencies
 */
const path = require( 'path' );
const WebpackBar = require( 'webpackbar' );
const MomentTimezoneDataPlugin = require( 'moment-timezone-data-webpack-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const {
	getAssets,
	getPackages,
	getConfig,
	camelCaseDash,
} = require( './utils' );

// This must be set for WordPress scripts compatibility
process.env.WP_COPY_PHP_FILES_TO_DIST = true;

/**
 * Create optimized Webpack config extending @wordpress/scripts.
 * Processes assets, packages, and applies performance optimizations.
 *
 * @param {Object}          baseConfig - WordPress base Webpack config (required)
 * @param {Object|Function} files      - Entry files config or transformer function
 * @return {Object} Enhanced Webpack configuration object
 * @throws {Error} When baseConfig is invalid
 * @example
 * const config = createConfig(wpConfig, { 'app': './src/app.js' });
 * const config = createConfig(wpConfig, (entries) => ({ ...entries, custom: './custom.js' }));
 */
const createConfig = ( baseConfig, files = ( x ) => x ) => {
	if ( ! baseConfig || typeof baseConfig !== 'object' ) {
		throw new Error(
			'A valid @wordpress/scripts config must be passed as the first argument.'
		);
	}

	// Get configuration based on the context directory
	const CONFIG = getConfig( baseConfig?.context || process.cwd() );

	// Set the source path early for WordPress scripts block detection
	process.env.WP_SOURCE_PATH = CONFIG.SOURCE_DIR;

	// Build the list of packages based on the configured patterns
	const packages = getPackages( CONFIG.SOURCE_PATH, CONFIG.PACKAGE_PATTERNS );

	const getEntries = () => ( {
		...getAssets( CONFIG.SOURCE_PATH, CONFIG.ASSET_PATTERNS ),
		...packages.reduce( ( acc, pkg ) => {
			const relativePath = path.relative( CONFIG.SOURCE_PATH, pkg.path );
			const entryName = `${ relativePath.split( path.sep )[ 0 ] }/${ pkg.packageName }`;
			acc[ entryName ] = {
				import: path.resolve( pkg.main ),
				library: {
					name: [ pkg.externalName, camelCaseDash( pkg.packageName ) ],
					type: 'window',
				},
			};
			return acc;
		}, {} ),
	} );

	const config = {
		...baseConfig,
		entry: {
			...( typeof baseConfig.entry === 'function' ? baseConfig.entry() : baseConfig.entry ),
			...( typeof files === 'function' ? files( getEntries() ) : files ) || {},
		},
		output: {
			...baseConfig.output,
			path: path.resolve( CONFIG.OUTPUT_PATH ),
			chunkFilename: 'chunks/[name].js',
			enabledLibraryTypes: [ 'window', 'commonjs' ],
		},
		resolve: {
			...baseConfig.resolve,
			modules: [ path.join( process.cwd(), 'node_modules' ), path.join( CONFIG.SOURCE_PATH, 'node_modules' ) ],
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
		plugins: [
			...baseConfig.plugins.filter( Boolean ),

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
			 * Show progressbar for cleaner build output.
			 *
			 * @see https://github.com/unjs/webpackbar
			 */
			new WebpackBar(),
		],
	};

	// Conditionally add DependencyExtractionWebpackPlugin if packages exist
	if ( packages.length > 0 ) {
		// Filter out any existing DependencyExtractionWebpackPlugin and add our custom one
		config.plugins = config.plugins
			.filter( ( plugin ) => plugin.constructor.name !== 'DependencyExtractionWebpackPlugin' )
			.concat( [
				/**
				 * Extracts dependencies from the build and generates a PHP file
				 *
				 * @see https://www.npmjs.com/package/@wordpress/dependency-extraction-webpack-plugin
				 */
				new DependencyExtractionWebpackPlugin( {
					requestToExternal( request ) {
						if ( request.endsWith( '.css' ) ) {
							return;
						}

						const pkg = packages.find( ( p ) => request.startsWith( p.namespace ) );
						if ( ! pkg ) {
							return;
						}

						const subName = request.substring( pkg.namespace.length );
						return [ pkg.externalName, camelCaseDash( subName ) ];
					},

					requestToHandle( request ) {
						if ( request.endsWith( '.css' ) ) {
							return;
						}

						const pkg = packages.find( ( p ) => request.startsWith( p.namespace ) );
						if ( ! pkg ) {
							return;
						}

						const subName = request.substring( pkg.namespace.length );
						return `${ pkg.handleName }-${ subName }`;
					},
				} ),
			] );
	}

	// Conditionally add CopyWebpackPlugin if copy patterns exist
	if ( CONFIG.COPY_PATTERNS?.length > 0 ) {
		config.plugins.push(
			/**
			 * Copy source files/directories to a build directory.
			 *
			 * @see https://www.npmjs.com/package/copy-webpack-plugin
			 */
			new CopyWebpackPlugin( {
				patterns: CONFIG.COPY_PATTERNS,
			} )
		);
	}

	return config;
};

module.exports = createConfig;
