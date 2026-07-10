/**
 * Text Domain Plugin for Webpack
 *
 * Replaces the 'byteever' text domain with the consumer plugin's own domain.
 *
 * - Vendor PHP: runs node-wp-i18n's addtextdomain on vendor/byteever.
 * - Project JS: injects @automattic/babel-plugin-replace-textdomain into babel-loader.
 * - Packages: runs node_modules/@byteever JS through the same transform.
 *
 * Text domain detected from package.json: textDomain → name → folder name.
 */

/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );
const wpi18n = require( 'node-wp-i18n' );

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
	 *                                              package.json (textDomain → name → folder) when empty.
	 * @param {Array|boolean} options.updateDomains List of text domains to replace, or true for all.
	 */
	constructor( options = {} ) {
		this.options = {
			textdomain: '',
			updateDomains: [],
			...options,
		};
	}

	apply( compiler ) {
		const rootPath = compiler.context;
		const { updateDomains } = this.options;
		const textDomain = (
			this.options.textdomain ||
			getPackageProp( 'textDomain' ) ||
			getPackageProp( 'name' ) ||
			path.basename( rootPath )
		)
			.toLowerCase()
			.replace( /^@/, '' )
			.replace( /[^a-z0-9-]+/g, '-' );

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
	 */
	getBabelTextdomain( textDomain ) {
		const { updateDomains } = this.options;

		if ( true === updateDomains ) {
			return textDomain;
		}

		return Object.fromEntries(
			updateDomains.map( ( domain ) => [ domain, textDomain ] )
		);
	}

	/**
	 * Replace the text domain in vendor PHP files via node-wp-i18n.
	 */
	replacePhpTextDomain( rootPath, textDomain ) {
		const vendorPath = path.resolve( rootPath, 'vendor/byteever' );

		if ( ! fs.existsSync( vendorPath ) ) {
			return Promise.resolve();
		}

		const files = [];
		const walk = ( dir ) => {
			for ( const entry of fs.readdirSync( dir, {
				withFileTypes: true,
			} ) ) {
				const full = path.join( dir, entry.name );
				if ( entry.isDirectory() ) {
					walk( full );
				} else if ( entry.name.endsWith( '.php' ) ) {
					files.push( full );
				}
			}
		};
		walk( vendorPath );

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
				// eslint-disable-next-line no-console
				console.warn(
					`${ PLUGIN_NAME }: skipped vendor PHP rewrite (${ error.message }).`
				);
			} );
	}

	/**
	 * Rewrite the text domain in JS via babel, including @byteever packages.
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
								entry[ 0 ] === plugin[ 0 ]
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
								'@wordpress/scripts/package.json'
							)
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
