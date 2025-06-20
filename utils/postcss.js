/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { resolveConfigFile } = require( './package' );

/**
 * Create a PostCSS loader config for a given package root.
 * @param {string} pkgRoot     - The root directory of the package.
 * @param {string} projectRoot - The root directory of the project/plugin.
 * @return {object|null} PostCSS loader config or null if not applicable.
 */
function getPostCSSLoaderConfig( pkgRoot, projectRoot ) {
	// 1. Check for tailwind.config.js in package root
	const tailwindConfig = resolveConfigFile( 'tailwind.config.js', pkgRoot );
	if ( ! tailwindConfig ) {
		return null;
	} // No Tailwind config, skip special handling

	// 2. Check for postcss.config.js in package root, then project root
	let postcssConfig = resolveConfigFile( 'postcss.config.js', pkgRoot );
	if ( ! postcssConfig && projectRoot ) {
		postcssConfig = resolveConfigFile( 'postcss.config.js', projectRoot );
	}

	// 3. If found, require it and check for Tailwind
	if ( postcssConfig ) {
		const configObj = require( postcssConfig );
		const plugins = configObj.plugins || {};
		const hasTailwind = Object.keys( plugins ).some(
			( k ) => k === 'tailwindcss' || k === 'tailwindcss/nesting' || ( typeof plugins[ k ] === 'function' && plugins[ k ].postcssPlugin === 'tailwindcss' )
		);
		if ( hasTailwind ) {
			return { postcssOptions: configObj };
		}
		// Inject Tailwind if missing
		return {
			postcssOptions: {
				...configObj,
				plugins: {
					tailwindcss: {},
					...plugins,
				},
			},
		};
	}

	// 4. No postcss config found, use default with Tailwind
	return {
		postcssOptions: {
			plugins: {
				tailwindcss: {},
				autoprefixer: {},
			},
		},
	};
}

module.exports = {
	getPostCSSLoaderConfig,
};
