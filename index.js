/**
 * External dependencies
 */
const WebpackBar = require( 'webpackbar' );
const MomentTimezoneDataPlugin = require( 'moment-timezone-data-webpack-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const path = require( 'path' );
/**
 * Internal dependencies
 */
const { globFiles, hasArgInCLI, getArgFromCLI } = require( './utils' );

// This must go before calling `createConfig` to ensure the environment variable is set.
process.env.WP_SOURCE_PATH = process.env.WP_SOURCE_PATH || 'resources';

/**
 * Create Webpack config extending @wordpress/scripts.
 *
 * @param {Object} baseConfig - WordPress base Webpack config.
 * @param {Object|Function} files      - List of JS or CSS/SCSS entry files.
 * @return {Object} Final Webpack configuration.
 */
function createConfig( baseConfig, files =  x => x ) {
	if ( ! baseConfig || typeof baseConfig !== 'object' ) {
		throw new Error(
			'A valid @wordpress/scripts config must be passed as the first argument.'
		);
	}

	const output = hasArgInCLI( '--output-path' ) ? getArgFromCLI('--output-path' ) : 'assets';
	const source = process.env.WP_SOURCE_PATH;
	const sourcePath = path.resolve( process.cwd(), source );
	const outputPath = path.resolve( process.cwd(), output );



	const getFiles = () => ({
		... globFiles( sourcePath, [
			'{scripts,styles}/*/index.{js,jsx,ts}',
			'{scripts,styles}/*/!(_)*.{js,jsx,ts,scss,sass,css}',
		] ).reduce( ( entries, file ) => {
			const [ , type, domain, filename ] =
			file.match( new RegExp(`${source}/([^/]+)\/([^/]+)\/([^/]+)`) ) || [];
			if ( ! type || ! domain || ! filename ) {
				return entries;
			}

			const name = path.basename( filename, path.extname( filename ) );
			entries[
				`${ type }/${ domain }-${ name }`
					.replace(
						new RegExp( `^${ type }/(?!admin-|frontend-)([^-]+)-` ),
						`${ type }/`
					)
					.replace( new RegExp( `\\b(${ domain })-\\1\\b` ), '$1' )
				] = path.resolve( file );
			return entries;
		}, {} ),
		...globFiles( sourcePath, [
			'client/*/index.{js,jsx,ts}',
			'client/*/*/index.{js,jsx,ts}',
		] ).reduce( ( entries, file ) => {
			const match = file.match( new RegExp(`${source}/client/(.+?)\/(?:([^/]+)\/)?index\\.(js|jsx|ts)$`) );
			if ( ! match ) {
				return entries;
			}

			const [ , type, name = type ] = match;
			entries[
				`client/${ type }-${ name }`
					.replace( /^client\/(?!admin-|frontend-)([^-]+)-/, 'client/' )
					.replace( new RegExp( `\\b(${ type })-\\1\\b` ), '$1' )
				] = path.resolve( file );
			return entries;
		}, {} ),
	})


	return {
		...baseConfig,
		entry: {
			...( typeof baseConfig.entry === 'function' ? baseConfig.entry() : baseConfig.entry ),
			...( typeof files === 'function' ? files( getFiles() ) : files ) || {},
		},
		output: {
			...baseConfig.output,
			path: outputPath,
		},
		resolve: {
			...baseConfig.resolve,
			modules: [ path.resolve( process.cwd(), 'node_modules' ) ],
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
			...baseConfig.plugins,

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
				patterns: [
					{
						from: 'images/*.{jpg,jpeg,png,gif,svg}',
						to: 'images/[name][ext]',
						context: sourcePath,
						noErrorOnMissing: true,
					},
					// Fonts in the src/fonts directory to the assets/fonts directory.
					{
						from: 'fonts/**/*.{woff,woff2,eot,ttf,otf}',
						context: sourcePath,
						noErrorOnMissing: true,
					},
				],
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
