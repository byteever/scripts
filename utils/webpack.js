/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { getArgFromCLI, getCurrentWorkingDirectory } = require( './process' );
const { getPackageProp } = require( './package' );
const { formatNamespace, lowerCaseDash, camelCaseDash } = require( './strings' );

/**
 * Get enhanced configuration from package.json with intelligent defaults
 *
 * @return {Object} Complete configuration object
 */
const getConfig = () => {
	const SOURCE_DIR = process.env.WP_SOURCE_PATH || 'resources';
	const OUTPUT_DIR = getArgFromCLI( '--output-path' ) || 'assets';
	const SOURCE_PATH = path.resolve( getCurrentWorkingDirectory(), SOURCE_DIR );
	const OUTPUT_PATH = path.resolve( getCurrentWorkingDirectory(), OUTPUT_DIR );
	const PROJECT_NAME = getPackageProp( 'name' ) || 'unknown-package';

	return {
		SOURCE_DIR,
		OUTPUT_DIR,
		SOURCE_PATH,
		OUTPUT_PATH,
		PROJECT_NAME,
		PROJECT_NAMESPACE: formatNamespace( PROJECT_NAME ),
		PROJECT_EXTERNAL: camelCaseDash( PROJECT_NAME ),
		PROJECT_HANDLE: lowerCaseDash( PROJECT_NAME ),
		COPY_PATTERNS: [
			{
				from: 'images/**/*.{jpg,jpeg,png,gif,svg}',
				to: 'images/[name][ext]',
				context: SOURCE_PATH,
				noErrorOnMissing: true,
			},
			{
				from: 'fonts/**/*.{woff,woff2,eot,ttf,otf}',
				context: SOURCE_PATH,
				noErrorOnMissing: true,
			},
		],
		ENTRY_PATTERNS: {
			SCRIPTS: [
				'scripts/!(_)*.{js,jsx,ts}',
				'scripts/*/!(_)*.{js,jsx,ts,}',
			],
			STYLES: [
				'styles/!(_)*.{scss,sass,css}',
				'styles/*/!(_)*.{scss,sass,css}',
			],
			CLIENT: [
				'client/index.{js,jsx,ts}',
				'client/*/index.{js,jsx,ts}',
				'client/*/*/index.{js,jsx,ts}',
			],
			PACKAGES: [
				'packages/*/src/index.{js,jsx,ts}',
			],
		},
	};
};

module.exports = { getConfig };
