/**
 * Drop Async Chunk RTL Plugin for Webpack
 *
 * The RtlCssPlugin in @wordpress/scripts generates a `-rtl.css` for every chunk.
 * WordPress only swaps to a `-rtl` stylesheet for enqueued styles, never for a
 * webpack-runtime-loaded chunk, so the RTL files emitted for async (lazy)
 * chunks ship but never load. This removes them, keeping RTL only for the
 * initial entry stylesheets.
 */

class DropAsyncChunkRtlPlugin {
	apply( compiler ) {
		const { Compilation } = compiler.webpack;

		compiler.hooks.compilation.tap(
			'DropAsyncChunkRtlPlugin',
			( compilation ) => {
				compilation.hooks.processAssets.tap(
					{
						name: 'DropAsyncChunkRtlPlugin',
						// After RtlCssPlugin (STAGE_OPTIMIZE) emits the RTL files.
						stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
					},
					() => {
						for ( const chunk of compilation.chunks ) {
							if ( chunk.canBeInitial() ) {
								continue;
							}

							for ( const file of Array.from( chunk.files ) ) {
								if ( file.endsWith( '-rtl.css' ) ) {
									compilation.deleteAsset( file );
								}
							}
						}
					},
				);
			},
		);
	}
}

module.exports = DropAsyncChunkRtlPlugin;
