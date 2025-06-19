/**
 * External dependencies
 */
const fs = require( 'fs' );
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
const {
	findTailwindConfig,
	findPostCSSConfig,
	postCSSConfigHasTailwind,
	injectTailwindIntoPostCSS,
	createTemporaryPostCSSConfig,
} = require( './utils/tailwind' );

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

	// Process package-specific Tailwind configurations
	const processedPackages = packages.map( ( pkg ) => {
		const packageDir = path.dirname( pkg.path );
		const tailwindConfigPath = findTailwindConfig( packageDir );

		if ( tailwindConfigPath ) {
			// Package has Tailwind config, check for PostCSS config
			let postCSSConfigPath = findPostCSSConfig( packageDir );

			if ( ! postCSSConfigPath ) {
				// Check plugin root for PostCSS config
				const pluginRoot = baseConfig?.context || process.cwd();
				postCSSConfigPath = findPostCSSConfig( pluginRoot );
			}

			if ( postCSSConfigPath ) {
				// PostCSS config exists, check if it includes Tailwind
				if ( ! postCSSConfigHasTailwind( postCSSConfigPath ) ) {
					// Inject Tailwind into existing PostCSS config
					injectTailwindIntoPostCSS( postCSSConfigPath, tailwindConfigPath );
				}
			} else {
				// No PostCSS config found, create a temporary one
				const tempConfigPath = createTemporaryPostCSSConfig( packageDir, tailwindConfigPath );
				if ( tempConfigPath ) {
					// Mark this package as having a temporary PostCSS config
					pkg.tempPostCSSConfig = tempConfigPath;
				}
			}

			// Mark this package as Tailwind-enabled
			pkg.hasTailwind = true;
			pkg.tailwindConfigPath = tailwindConfigPath;
		}

		return pkg;
	} );

	const getEntries = () => {
		const baseEntries = getAssets( CONFIG.SOURCE_PATH, CONFIG.ASSET_PATTERNS );

		// Add package entries
		const packageEntries = processedPackages.reduce( ( acc, pkg ) => {
			const relativePath = path.relative( CONFIG.SOURCE_PATH, pkg.path );
			const entryName = `${ relativePath.split( path.sep )[ 0 ] }/${ pkg.packageName }`;

			// Main JavaScript entry
			acc[ entryName ] = {
				import: path.resolve( pkg.main ),
				library: {
					name: [ pkg.externalName, camelCaseDash( pkg.packageName ) ],
					type: 'window',
				},
			};

			// If package has Tailwind config, look for CSS files to process
			if ( pkg.hasTailwind ) {
				const packageDir = path.dirname( pkg.path );
				const cssFiles = [
					path.join( packageDir, 'src', 'style.scss' ),
					path.join( packageDir, 'src', 'style.css' ),
					path.join( packageDir, 'style.scss' ),
					path.join( packageDir, 'style.css' ),
				].filter( ( file ) => fs.existsSync( file ) );

				if ( cssFiles.length > 0 ) {
					// Create CSS entry in the same directory as the JS package
					const cssEntryName = `${ relativePath.split( path.sep )[ 0 ] }/${ pkg.packageName }`;
					acc[ cssEntryName ] = cssFiles[ 0 ];
				}
			}

			return acc;
		}, {} );

		return {
			...baseEntries,
			...packageEntries,
		};
	};

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
			modules: [ path.join( CONFIG.SOURCE_PATH, 'node_modules' ) ],
		},
		externals: {
			...baseConfig.externals,
			lodash: 'lodash',
			jquery: 'jQuery',
			$: 'jQuery',
		},
		optimization: {
			...baseConfig.optimization,
			splitChunks: {
				...baseConfig.optimization?.splitChunks,
				cacheGroups: {
					...baseConfig.optimization?.splitChunks?.cacheGroups,
					style: {
						type: 'css/mini-extract',
						test: /[\\/]style(\.module)?\.(pc|sc|sa|c)ss$/,
						chunks: 'all',
						enforce: true,
						name( _, chunks, cacheGroupKey ) {
							const chunkName = chunks[ 0 ].name;
							// Only remove style- prefix for non-block entries
							// Blocks need to maintain editor- and style- separation for WordPress
							if ( chunkName.includes( '/blocks' ) || chunkName.startsWith( 'blocks' ) ) {
								// Keep original WordPress behavior for blocks
								return `${ path.dirname( chunkName ) }/${ cacheGroupKey }-${ path.basename( chunkName ) }`;
							}
							// Remove the style- prefix for non-block entries
							return `${ path.dirname( chunkName ) }/${ path.basename( chunkName ) }`;
						},
					},
				},
			},
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
	if ( processedPackages.length > 0 ) {
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

						const pkg = processedPackages.find( ( p ) => request.startsWith( p.namespace ) );
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

						const pkg = processedPackages.find( ( p ) => request.startsWith( p.namespace ) );
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

	// console.log( 'config', config );

	return config;
};

module.exports = createConfig;
