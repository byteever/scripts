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
const { globFiles, getConfig, camelCaseDash } = require( './utils' );

/**
 * Initialize configuration and environment
 */
const CONFIG = getConfig();

// This must go before calling `createConfig` to ensure the environment variable is set.
process.env.WP_SOURCE_PATH = CONFIG.SOURCE_DIR;
process.env.WP_COPY_PHP_FILES_TO_DIST = true;

/**
 * Create Webpack config extending @wordpress/scripts.
 *
 * @param {Object}          baseConfig - WordPress base Webpack config.
 * @param {Object|Function} files      - List of JS or CSS/SCSS entry files.
 * @return {Object} Final Webpack configuration.
 */
function createConfig( baseConfig, files = ( x ) => x ) {
	if ( ! baseConfig || typeof baseConfig !== 'object' ) {
		throw new Error(
			'A valid @wordpress/scripts config must be passed as the first argument.'
		);
	}

	const getEntries = () => ( {
		...globFiles( CONFIG.SOURCE_PATH, CONFIG.ENTRY_PATTERNS.SCRIPTS ).reduce( ( entries, file ) => {
			const [ , subdirectory, filename ] = file.match( /\/scripts\/(?:([^/]+)\/)?([^/]+\.(js|jsx|ts))$/ );
			const name = path.basename( filename, path.extname( filename ) );
			const entryName = `scripts/${ [ subdirectory, name ].filter( Boolean ).join( '-' ) }`
				.replace( /^scripts\/(?!admin-|frontend-)([^-]+)-/, 'scripts/' )
				.replace( new RegExp( `\\b(${ subdirectory })-\\1\\b` ), '$1' );

			entries[ entryName ] = path.resolve( file );
			return entries;
		}, {} ),
		...globFiles( CONFIG.SOURCE_PATH, CONFIG.ENTRY_PATTERNS.STYLES ).reduce( ( entries, file ) => {
			const [ , subdirectory, filename ] = file.match( /\/styles\/(?:([^/]+)\/)?([^/]+\.(scss|sass|css))$/ );
			const name = path.basename( filename, path.extname( filename ) );
			const entryName = `styles/${ [ subdirectory, name ].filter( Boolean ).join( '-' ) }`
				.replace( /^styles\/(?!admin-|frontend-)([^-]+)-/, 'styles/' )
				.replace( new RegExp( `\\b(${ subdirectory })-\\1\\b` ), '$1' );

			entries[ entryName ] = path.resolve( file );
			return entries;
		}, {} ),
		...globFiles( CONFIG.SOURCE_PATH, CONFIG.ENTRY_PATTERNS.CLIENT ).reduce( ( entries, file ) => {
			const [ , entryName = 'index' ] = file.match( /\/client\/(?:([^/]+)\/)?index\.(js|jsx|ts)$/ );
			entries[ `client/${ entryName }` ] = path.resolve( file );
			return entries;
		}, {} ),
		...globFiles( CONFIG.SOURCE_PATH, CONFIG.ENTRY_PATTERNS.PACKAGES ).reduce( ( entries, file ) => {
			const [ , packageName ] = file.match( /\/packages\/(.+?)\/src\/index\.(js|jsx|ts)$/ );

			const entryName = `packages/${ packageName }`;
			entries[ entryName ] = {
				import: path.resolve( file ),
				library: {
					name: [
						CONFIG.PROJECT_EXTERNAL,
						camelCaseDash( packageName ),
					],
					type: 'window',
				},
			};
			return entries;
		},
		{}
		),
	} );

	return {
		...baseConfig,
		entry: {
			...( typeof baseConfig.entry === 'function'
				? baseConfig.entry()
				: baseConfig.entry ),
			...( ( typeof files === 'function' ? files( getEntries() ) : files ) ||
				{} ),
		},
		output: {
			...baseConfig.output,
			path: CONFIG.OUTPUT_PATH,
			chunkFilename: 'chunks/[name].js',
		},
		resolve: {
			...baseConfig.resolve,
			modules: [ path.resolve( process.cwd(), 'node_modules' ) ],
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
			...baseConfig.plugins.filter( ( plugin ) => plugin.constructor.name !== 'DependencyExtractionWebpackPlugin' ),

			/**
			 * Extracts dependencies from the build and generates a PHP file
			 *
			 * @see https://www.npmjs.com/package/@wordpress/dependency-extraction-webpack-plugin
			 */
			new DependencyExtractionWebpackPlugin( {
				requestToExternal( request ) {
					if ( request.endsWith( '.css' ) ) {
						return false;
					}

					if ( request.startsWith( CONFIG.PROJECT_NAMESPACE ) ) {
						return [ CONFIG.PROJECT_EXTERNAL, camelCaseDash( request.substring( CONFIG.PROJECT_NAMESPACE.length ) ),
						];
					}
				},
				requestToHandle( request ) {
					if ( request.startsWith( CONFIG.PROJECT_NAMESPACE ) ) {
						return `${ CONFIG.PROJECT_HANDLE }-${ request.substring( CONFIG.PROJECT_NAMESPACE.length ) }`;
					}
				},
			} ),

			/**
			 * Reduces data for moment-timezone.
			 *
			 * @see https://www.npmjs.com/package/moment-timezone-data-webpack-plugin
			 */
			new MomentTimezoneDataPlugin( {
				// This strips out timezone data before the year 2000 to make a smaller file.
				startYear: 2000,
			} ),

			/**
			 * Copy source files/directories to a build directory.
			 *
			 * @see https://www.npmjs.com/package/copy-webpack-plugin
			 */
			new CopyWebpackPlugin( {
				patterns: CONFIG.COPY_PATTERNS,
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
}

module.exports = createConfig;
