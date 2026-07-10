/**
 * Text Domain Plugin for Webpack
 *
 * Replaces the 'byteever' text domain with the consumer plugin's own domain.
 *
 * - Vendor PHP: rewrites the domain argument of i18n calls in vendor/byteever.
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

/**
 * Internal dependencies
 */
const { getPackageProp } = require( '../utils' );

const PLUGIN_NAME = 'TextDomainPlugin';
const REPLACE_DOMAIN = 'byteever';
const I18N_DOMAIN_ARG =
	/((?<![\w$])(?:__|_e|_x|_ex|_n|_nx|_n_noop|_nx_noop|esc_attr__|esc_attr_e|esc_attr_x|esc_html__|esc_html_e|esc_html_x)\s*\((?:[^()]|\([^()]*\))*?,\s*)(['"])byteever\2(\s*\))/g;

class TextDomainPlugin {
	apply( compiler ) {
		const rootPath = compiler.context;
		const textDomain =
			getPackageProp( 'textDomain' ) ||
			getPackageProp( 'name' ) ||
			path.basename( rootPath );

		if ( ! textDomain || textDomain === REPLACE_DOMAIN ) {
			return;
		}

		compiler.hooks.environment.tap( PLUGIN_NAME, () => {
			this.replacePhpTextDomain( rootPath, textDomain );
			this.addBabelPlugin( compiler, textDomain );
		} );
	}

	/**
	 * Replace the text domain in vendor PHP i18n calls.
	 */
	replacePhpTextDomain( rootPath, textDomain ) {
		const vendorPath = path.resolve( rootPath, 'vendor/byteever' );

		if ( ! fs.existsSync( vendorPath ) ) {
			return;
		}

		let changed = 0;
		const walk = ( dir ) => {
			for ( const entry of fs.readdirSync( dir, {
				withFileTypes: true,
			} ) ) {
				const full = path.join( dir, entry.name );
				if ( entry.isDirectory() ) {
					walk( full );
				} else if ( entry.name.endsWith( '.php' ) ) {
					const source = fs.readFileSync( full, 'utf8' );
					const output = source.replace(
						I18N_DOMAIN_ARG,
						`$1$2${ textDomain }$2$3`
					);
					if ( output !== source ) {
						fs.writeFileSync( full, output );
						changed++;
					}
				}
			}
		};
		walk( vendorPath );

		if ( changed > 0 ) {
			// eslint-disable-next-line no-console
			console.log( `${ PLUGIN_NAME }: Updated ${ changed } PHP file(s).` );
		}
	}

	/**
	 * Rewrite the text domain in JS via babel, including @byteever packages.
	 */
	addBabelPlugin( compiler, textDomain ) {
		const plugin = [
			require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
			{ textdomain: { [ REPLACE_DOMAIN ]: textDomain } },
		];

		for ( const rule of compiler.options.module.rules ) {
			for ( const use of [].concat( rule?.use || [] ) ) {
				if (
					typeof use === 'object' &&
					/babel-loader/.test( use.loader || '' )
				) {
					use.options = use.options || {};
					use.options.plugins = [
						...( use.options.plugins || [] ),
						plugin,
					];
				}
			}
		}

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
