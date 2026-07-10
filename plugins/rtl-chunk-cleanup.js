/**
 * Removes RTL files generated for CSS chunks.
 * WordPress's RtlCssPlugin generates RTL for all CSS, but we only want it for entry points.
 * This runs after RtlCssPlugin and removes unwanted chunk RTL files.
 */
class RtlChunkCleanupPlugin {
	apply( compiler ) {
		compiler.hooks.compilation.tap( 'RtlChunkCleanup', ( compilation ) => {
			compilation.hooks.processAssets.tap(
				{
					name: 'RtlChunkCleanup',
					// Run late so all CSS assets exist (after WP RTL has emitted files)
					stage: compilation.PROCESS_ASSETS_STAGE_REPORT,
				},
				() => {
					// Build a set of CSS files (and their RTL twins) that belong to entrypoints
					const entryCss = new Set();
					for ( const [
						,
						entry,
					] of compilation.entrypoints.entries() ) {
						const files = entry.getFiles();
						files.forEach( ( f ) => {
							if ( f.endsWith( '.css' ) ) {
								entryCss.add( f );
								entryCss.add(
									f.replace( /\.css$/, '-rtl.css' )
								);
							}
						} );
					}

					// Remove any RTL CSS that does not correspond to an entry CSS file
					Object.keys( compilation.assets ).forEach( ( filename ) => {
						if (
							/-rtl\.css$/.test( filename ) &&
							! entryCss.has( filename )
						) {
							delete compilation.assets[ filename ];
							compilation.chunks.forEach( ( chunk ) => {
								chunk.files.delete( filename );
							} );
						}
					} );
				}
			);
		} );
	}
}

module.exports = RtlChunkCleanupPlugin;
