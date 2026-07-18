/**
 * Script Externals Plugin for Webpack
 *
 * Extends DependencyExtractionWebpackPlugin to handle custom script externals.
 * Reads externals from webpack config at compile time and generates correct
 * script handles in .asset.php files.
 *
 * @example Producer (exposes library):
 * entry: {
 *   'shared': {
 *     import: './src/shared.js',
 *     library: { name: ['starter', 'shared'], type: 'window' }
 *   }
 * }
 *
 * @example Consumer (uses library):
 * externals: {
 *   '@starter/shared': ['starter', 'shared']
 * }
 */

/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( require.resolve(
	'@wordpress/dependency-extraction-webpack-plugin',
	{
		paths: [
			path.dirname( require.resolve( '@wordpress/scripts/package.json' ) ),
		],
	}
) );

/**
 * Script Externals Plugin class.
 *
 * Extends DependencyExtractionWebpackPlugin to handle custom script externals
 * defined in webpack config and generate correct script handles.
 */
class ScriptExternalsPlugin extends DependencyExtractionWebpackPlugin {
	/**
	 * Create a ScriptExternalsPlugin instance.
	 *
	 * @param {Object}   options                  Plugin options passed to parent.
	 * @param {Function} options.requestToExternal Optional custom external resolver.
	 * @param {Function} options.requestToHandle   Optional custom handle resolver.
	 */
	constructor( options = {} ) {
		const scriptExternalsMap = new Map();
		const originalRequestToExternal = options.requestToExternal;
		const originalRequestToHandle = options.requestToHandle;

		super( {
			...options,
			requestToExternal( request ) {
				const external = scriptExternalsMap.get( request );
				if ( external ) {
					return external.global;
				}
				return typeof originalRequestToExternal === 'function'
					? originalRequestToExternal( request )
					: undefined;
			},
			requestToHandle( request ) {
				const external = scriptExternalsMap.get( request );
				if ( external ) {
					return external.handle;
				}
				return typeof originalRequestToHandle === 'function'
					? originalRequestToHandle( request )
					: undefined;
			},
		} );

		this.scriptExternalsMap = scriptExternalsMap;
	}

	/**
	 * Parse webpack externals and build handle map.
	 *
	 * @param {Object} externals Webpack externals configuration.
	 */
	parseExternals( externals ) {
		if (
			! externals ||
			typeof externals !== 'object' ||
			Array.isArray( externals )
		) {
			return;
		}

		for ( const [ request, external ] of Object.entries( externals ) ) {
			if ( ! Array.isArray( external ) ) {
				continue;
			}

			// Skip @wordpress/* (handled by parent plugin) and non-scoped packages
			if (
				request.startsWith( '@wordpress/' ) ||
				! request.startsWith( '@' )
			) {
				continue;
			}

			this.scriptExternalsMap.set( request, {
				global: external,
				handle: external.join( '-' ),
			} );
		}
	}

	/**
	 * Apply plugin to webpack compiler.
	 *
	 * @param {Object} compiler Webpack compiler instance.
	 */
	apply( compiler ) {
		this.parseExternals( compiler.options.externals );
		super.apply( compiler );
	}
}

module.exports = ScriptExternalsPlugin;
