/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { getPackageProp } = require( './package' );

/**
 * Get enhanced configuration from package.json with intelligent defaults.
 * Builds comprehensive webpack configuration object with optimized paths and patterns.
 *
 * @param {string} context - Context path to resolve relative paths (defaults to cwd)
 * @return {Object} Complete configuration object with all necessary paths and patterns
 * @example
 * const config = getConfig('/path/to/project');
 * console.log(config.SOURCE_PATH); // '/path/to/project/resources'
 */
const getConfig = ( context = process.cwd() ) => {
	const packageConfig = getPackageProp( '@byteever/scripts' ) || {};
	const projectName = getPackageProp( 'name' );
	const cwd = process.cwd();
	const relativeContext = path.relative( cwd, context );
	const sourceDirectoryName = path.join( relativeContext, packageConfig.source || 'resources' );
	const outputDirectoryName = path.join( relativeContext, packageConfig.output || 'assets' );
	const sourceDirectoryPath = path.resolve( cwd, sourceDirectoryName );
	const outputDirectoryPath = path.resolve( cwd, outputDirectoryName );

	return {
		PROJECT_NAME: projectName,
		SOURCE_DIR: sourceDirectoryName,
		OUTPUT_DIR: outputDirectoryName,
		SOURCE_PATH: sourceDirectoryPath,
		OUTPUT_PATH: outputDirectoryPath,
		ASSET_PATTERNS: [
			[
				'scripts/!(_)*.{js,jsx}',
				'scripts/*/!(_)*.{js,jsx}',
			],
			[
				'styles/!(_)*.{scss,sass,css}',
				'styles/*/!(_)*.{scss,sass,css}',
			],
			[
				'client/index.{js,jsx}',
				'client/*/index.{js,jsx}',
				'client/*/*/index.{js,jsx}',
			],
			...( packageConfig.assetPatterns || [] ),
		],
		PACKAGE_PATTERNS: [
			[ 'packages/*/package.json' ],
			[ 'client/packages/*/package.json' ],
			[ 'scripts/packages/*/package.json' ],
			...( packageConfig.packagePatterns || [] ),
		],
		COPY_PATTERNS: [
			{
				from: 'images/**/*.{jpg,jpeg,png,gif,svg}',
				to: 'images/[name][ext]',
				context: sourceDirectoryPath,
				noErrorOnMissing: true,
			},
			{
				from: 'fonts/**/*.{woff,woff2,eot,ttf,otf,css}',
				context: sourceDirectoryPath,
				noErrorOnMissing: true,
			},
			...( packageConfig.copyPatterns || [] ).map( ( copyPattern ) => ( {
				...copyPattern,
				context: copyPattern.context ||
					( packageConfig.sourceDir ? path.resolve( sourceDirectoryPath, packageConfig.sourceDir ) : sourceDirectoryPath ),
			} ) ),
		],
	};
};

module.exports = { getConfig };
