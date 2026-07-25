/**
 * Text Domain Plugin for Webpack
 *
 * Replaces the 'byteever' text domain with the consumer plugin's own domain.
 *
 * - Vendor PHP: runs node-wp-i18n's addtextdomain on the included paths.
 * - Project JS: injects @automattic/babel-plugin-replace-textdomain into babel-loader.
 * - Packages: runs node_modules/@byteever JS through the same transform.
 *
 * Text domain detected from package.json: name → folder name.
 */

/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );
const wpi18n = require( 'node-wp-i18n' );
const glob = require( require.resolve( 'glob', {
	paths: [ path.dirname( require.resolve( 'node-wp-i18n/package.json' ) ) ],
} ) );

/**
 * WordPress dependencies
 */
const { getPackageProp } = require( '@wordpress/scripts/utils' );

const PLUGIN_NAME = 'TextDomainPlugin';

let phpRewritten = false;
const injectedRules = new WeakSet();

class TextDomainPlugin {
	/**
	 * Create a TextDomainPlugin instance.
	 *
	 * @param {Object}        options               Plugin options.
	 * @param {string}        options.textdomain    Project text domain. Detected from
	 *                                              package.json (name → folder) when empty.
	 * @param {Array|boolean} options.updateDomains List of text domains to replace, or true for all.
	 * @param {string[]}      options.include       Directories or glob patterns holding the PHP files to rewrite.
	 * @param {string[]}      options.exclude       Directories or glob patterns to skip.
	 */
	constructor( options = {} ) {
		this.options = {
			textdomain: '',
			updateDomains: [],
			include: [ 'vendor/byteever' ],
			exclude: [],
			...options,
		};
	}

	apply( compiler ) {
		const rootPath = compiler.context;
		const { updateDomains } = this.options;
		const textDomain = (
			this.options.textdomain ||
			getPackageProp( 'name' ) ||
			path.basename( rootPath )
		)
			.toLowerCase()
			.replace( /^@[^/]+\//, '' )
			.replace( /[^a-z0-9-]+/g, '-' )
			.replace( /^-+|-+$/g, '' );

		if (
			! textDomain ||
			( Array.isArray( updateDomains ) &&
				( ! updateDomains.length ||
					updateDomains.includes( textDomain ) ) )
		) {
			return;
		}

		compiler.hooks.environment.tap( PLUGIN_NAME, () => {
			this.addBabelPlugin( compiler, textDomain );
		} );

		for ( const hook of [ 'beforeRun', 'watchRun' ] ) {
			compiler.hooks[ hook ].tapPromise( PLUGIN_NAME, () => {
				if ( phpRewritten ) {
					return Promise.resolve();
				}
				phpRewritten = true;

				return this.replacePhpTextDomain( rootPath, textDomain );
			} );
		}
	}

	/**
	 * Get the babel replacement map for the domains to update.
	 *
	 * @param {string} textDomain Text domain to replace with.
	 * @return {string|Object} Plain domain string, or old-to-new domain map.
	 */
	getBabelTextdomain( textDomain ) {
		const { updateDomains } = this.options;

		if ( true === updateDomains ) {
			return textDomain;
		}

		return Object.fromEntries(
			updateDomains.map( ( domain ) => [ domain, textDomain ] ),
		);
	}

	/**
	 * Resolve directories or glob patterns to the PHP files they contain.
	 *
	 * @param {string[]} patterns Directories or glob patterns to resolve.
	 * @param {string}   cwd      Base directory for resolution.
	 * @return {Set<string>} Absolute PHP file paths.
	 */
	resolvePhpFiles( patterns, cwd ) {
		const files = new Set();

		for ( const pattern of patterns ) {
			for ( const match of glob.sync( pattern, {
				cwd,
				absolute: true,
			} ) ) {
				try {
					if ( fs.statSync( match ).isDirectory() ) {
						for ( const file of glob.sync( '**/*.php', {
							cwd: match,
							absolute: true,
						} ) ) {
							files.add( file );
						}
					} else if ( match.endsWith( '.php' ) ) {
						files.add( match );
					}
				} catch {
					// Skip unreadable paths.
				}
			}
		}

		return files;
	}

	/**
	 * Replace the text domain in PHP files via node-wp-i18n.
	 *
	 * @param {string} rootPath   Root the include/exclude patterns resolve from.
	 * @param {string} textDomain Text domain to write.
	 * @return {Promise<void>} Resolves when the rewrite finishes or is skipped.
	 */
	replacePhpTextDomain( rootPath, textDomain ) {
		const excluded = this.resolvePhpFiles( this.options.exclude, rootPath );
		const files = [
			...this.resolvePhpFiles( this.options.include, rootPath ),
		].filter( ( file ) => ! excluded.has( file ) );

		if ( ! files.length ) {
			return Promise.resolve();
		}

		return wpi18n
			.addtextdomain( files, {
				cwd: rootPath,
				textdomain: textDomain,
				updateDomains: this.options.updateDomains,
			} )
			.catch( ( error ) => {
				console.warn(
					`${ PLUGIN_NAME }: skipped vendor PHP rewrite (${ error.message }).`,
				);
			} );
	}

	/**
	 * Rewrite the text domain in JS via babel, including @byteever packages.
	 *
	 * @param {Object} compiler   Webpack compiler instance.
	 * @param {string} textDomain Text domain to write.
	 */
	addBabelPlugin( compiler, textDomain ) {
		const plugin = [
			require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
			{ textdomain: this.getBabelTextdomain( textDomain ) },
		];

		// The script and module configs share rule objects; inject once.
		for ( const rule of compiler.options.module.rules ) {
			for ( const use of [].concat( rule?.use || [] ) ) {
				if (
					typeof use === 'object' &&
					/babel-loader/.test( use.loader || '' )
				) {
					use.options = use.options || {};
					use.options.plugins = use.options.plugins || [];
					if (
						! use.options.plugins.some(
							( entry ) =>
								Array.isArray( entry ) &&
								entry[ 0 ] === plugin[ 0 ],
						)
					) {
						use.options.plugins.push( plugin );
					}
				}
			}
		}

		if ( injectedRules.has( compiler.options.module.rules ) ) {
			return;
		}
		injectedRules.add( compiler.options.module.rules );

		compiler.options.module.rules.push( {
			test: /\.js$/,
			include: /[\\/]node_modules[\\/]@byteever[\\/]/,
			use: {
				loader: require.resolve( 'babel-loader', {
					paths: [
						path.dirname(
							require.resolve(
								'@wordpress/scripts/package.json',
							),
						),
					],
				} ),
				options: {
					babelrc: false,
					configFile: false,
					plugins: [ plugin ],
				},
			},
		} );
	}
}

module.exports = TextDomainPlugin;
