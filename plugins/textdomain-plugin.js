/**
 * Text Domain Plugin for Webpack
 *
 * Replaces 'byteever' text domain in PHP vendor files and JS assets.
 *
 * - PHP: Spawns bin/set-textdomain.php (token_get_all) on vendor files.
 * - JS: Injects @automattic/babel-plugin-replace-textdomain into babel-loader.
 *
 * Text domain detected from package.json: textDomain → name → folder name.
 */

const path = require( 'path' );
const fs = require( 'fs' );
const spawn = require( 'cross-spawn' );
const { getPackageProp } = require( '../utils' );

const PLUGIN_NAME = 'TextDomainPlugin';
const REPLACE_DOMAIN = 'byteever';

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
	 * Replace text domain in vendor PHP files via set-textdomain.php.
	 */
	replacePhpTextDomain( rootPath, textDomain ) {
		const vendorPath = path.resolve( rootPath, 'vendor/byteever' );

		if ( ! fs.existsSync( vendorPath ) ) {
			return;
		}

		const files = [];
		const collect = ( dir ) => {
			for ( const entry of fs.readdirSync( dir, { withFileTypes: true } ) ) {
				const full = path.join( dir, entry.name );
				if ( entry.isDirectory() ) {
					collect( full );
				} else if ( entry.name.endsWith( '.php' ) ) {
					files.push( full );
				}
			}
		};
		collect( vendorPath );

		if ( ! files.length ) {
			return;
		}

		const argsFile = path.join(
			require( 'os' ).tmpdir(),
			`set-textdomain-${ Date.now() }.json`
		);

		fs.writeFileSync(
			argsFile,
			JSON.stringify( {
				textdomain: textDomain,
				files,
				updateDomains: [ REPLACE_DOMAIN ],
			} )
		);

		try {
			const result = spawn.sync(
				'php',
				[ path.resolve( __dirname, '../bin/set-textdomain.php' ), argsFile ],
				{ stdio: [ 'pipe', 'pipe', 'pipe' ] }
			);

			if ( result.status !== 0 ) {
				console.error( `${ PLUGIN_NAME }: PHP replacement failed: ${ result.stderr?.toString().trim() || 'Unknown error' }` );
			} else {
				try {
					const { changed } = JSON.parse( result.stdout.toString() );
					if ( changed > 0 ) {
						console.log( `${ PLUGIN_NAME }: Updated ${ changed } PHP file(s).` );
					}
				} catch {}
			}
		} finally {
			try { fs.unlinkSync( argsFile ); } catch {}
		}
	}

	/**
	 * Add @automattic/babel-plugin-replace-textdomain to babel-loader.
	 */
	addBabelPlugin( compiler, textDomain ) {
		const plugin = [
			require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
			{ textdomain: { [ REPLACE_DOMAIN ]: textDomain } },
		];

		for ( const rule of compiler.options.module.rules ) {
			for ( const use of [].concat( rule.use || [] ) ) {
				if ( typeof use === 'object' && /babel-loader/.test( use.loader || '' ) ) {
					use.options = use.options || {};
					use.options.plugins = use.options.plugins || [];
					use.options.plugins.push( plugin );
				}
			}
		}
	}
}

module.exports = TextDomainPlugin;