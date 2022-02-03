/**
 * Internal dependencies
 */
const {
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getNodeArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	spawnScript,
} = require( './cli' );

const {
	getJestOverrideConfigFile,
	getWebpackArgs,
	hasBabelConfig,
	hasCssnanoConfig,
	hasEslintConfig,
	hasEslintIgnoreConfig,
	hasJestConfig,
	hasPostCSSConfig,
	hasPrettierConfig,
	hasStylelintConfig,
	hasWebpackConfig,
} = require( './config' );
const { fromProjectRoot, fromConfigRoot, hasProjectFile } = require( './file' );
const { getPackageProp, hasPackageProp } = require( './package' );

module.exports = {
	fromProjectRoot,
	fromConfigRoot,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getJestOverrideConfigFile,
	getNodeArgsFromCLI,
	getPackageProp,
	getWebpackArgs,
	hasArgInCLI,
	hasBabelConfig,
	hasCssnanoConfig,
	hasEslintConfig,
	hasEslintIgnoreConfig,
	hasFileArgInCLI,
	hasJestConfig,
	hasPackageProp,
	hasPostCSSConfig,
	hasPrettierConfig,
	hasProjectFile,
	hasStylelintConfig,
	hasWebpackConfig,
	spawnScript,
};
