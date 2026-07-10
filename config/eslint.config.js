/**
 * Default ESLint flat config for @byteever/scripts.
 *
 * Projects spread this from their eslint.config.js, or keep an eslintrc
 * format .eslintrc.js which is converted here — ESLint 9 dropped the
 * eslintrc engine and @wordpress/eslint-plugin ships flat configs only, so
 * `plugin:` extends are resolved to their flat form before conversion.
 */

/**
 * External dependencies
 */
const path = require( 'path' );
const { FlatCompat } = require( '@eslint/eslintrc' );

/**
 * WordPress dependencies
 */
const { hasBabelConfig, hasProjectFile } = require( '@wordpress/scripts/utils' );

const wpScriptsPath = path.dirname(
	require.resolve( '@wordpress/scripts/package.json' )
);
const wpPlugin = require( require.resolve( '@wordpress/eslint-plugin', {
	paths: [ wpScriptsPath ],
} ) );

const compat = new FlatCompat( {
	baseDirectory: process.cwd(),
	resolvePluginsRelativeTo: process.cwd(),
} );

/**
 * Convert an eslintrc format config into flat config entries.
 *
 * @param {Object} eslintrc Config in eslintrc format.
 * @return {Object[]} Flat config entries.
 */
const toFlatConfig = ( eslintrc ) => {
	const { root, extends: extended = [], ...rest } = eslintrc;

	return [ extended ]
		.flat()
		.flatMap( ( name ) => {
			if ( ! name.startsWith( 'plugin:' ) ) {
				return toFlatConfig( require( name ) );
			}

			const slashIndex = name.lastIndexOf( '/' );
			const plugin = require( require.resolve(
				name
					.slice( 'plugin:'.length, slashIndex )
					.replace( /^(@[^/]+)$/, '$1/eslint-plugin' ),
				{ paths: [ process.cwd(), wpScriptsPath ] }
			) );
			const pluginConfig = plugin.configs[ name.slice( slashIndex + 1 ) ];

			return Array.isArray( pluginConfig )
				? pluginConfig
				: toFlatConfig( pluginConfig );
		} )
		.concat( compat.config( rest ) );
};

const config =
	hasProjectFile( '.eslintrc.js' ) && ! hasProjectFile( 'eslint.config.js' )
		? toFlatConfig( require( path.join( process.cwd(), '.eslintrc.js' ) ) )
		: [
				// Global ignores.
				{
					ignores: [
						'**/assets/build/**',
						'**/build/**',
						'**/node_modules/**',
						'**/vendor/**',
					],
				},

				// Base recommended config from @wordpress/eslint-plugin.
				...wpPlugin.configs[ 'recommended-with-formatting' ],

				// Unit test overrides.
				...wpPlugin.configs[ 'test-unit' ].map( ( testConfig ) => ( {
					...testConfig,
					files: [
						'**/@(test|__tests__)/**/*.js',
						'**/?(*.)test.js',
					],
				} ) ),

				// ByteEver conventions.
				{
					languageOptions: {
						globals: {
							wp: 'readonly',
							ajaxurl: 'readonly',
							jQuery: 'readonly',
						},
					},
					rules: {
						'import/no-unresolved': 'off',
						'import/no-extraneous-dependencies': 'off',
						'no-console': 'off',
						'@wordpress/dependency-group': 'warn',
					},
				},
		  ];

// If the project has no Babel config, provide defaults.
if ( ! hasBabelConfig() ) {
	config.push( {
		languageOptions: {
			parserOptions: {
				requireConfigFile: false,
				babelOptions: {
					presets: [
						require.resolve( '@wordpress/babel-preset-default', {
							paths: [ wpScriptsPath ],
						} ),
					],
				},
			},
		},
	} );
}

module.exports = config;
