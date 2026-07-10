/**
 * Blocks Manifest Plugin for Webpack
 *
 * Generates blocks-manifest.php inside the built blocks directory, replacing
 * the @wordpress/scripts plugin that writes it at the build root keyed for a
 * flat layout.
 */

/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );
const { spawnSync } = require( 'child_process' );

const PLUGIN_NAME = 'BlocksManifestPlugin';

class BlocksManifestPlugin {
	apply( compiler ) {
		compiler.hooks.afterEmit.tap( PLUGIN_NAME, () => {
			const blocksPath = path.join(
				compiler.options.output.path,
				'blocks'
			);

			if ( ! fs.existsSync( blocksPath ) ) {
				return;
			}

			const result = spawnSync(
				process.execPath,
				[
					require.resolve(
						'@wordpress/scripts/scripts/build-blocks-manifest'
					),
					`--input=${ blocksPath }`,
					`--output=${ path.join(
						blocksPath,
						'blocks-manifest.php'
					) }`,
				],
				{ stdio: 'inherit' }
			);

			if ( 0 !== result.status ) {
				// eslint-disable-next-line no-console
				console.error( `${ PLUGIN_NAME }: manifest generation failed.` );
			}
		} );
	}
}

module.exports = BlocksManifestPlugin;
