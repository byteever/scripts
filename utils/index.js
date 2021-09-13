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
	getEntryFiles,
	getJestOverrideConfigFile,
	getScriptsConfig,
	getScriptsPackageBuildConfig,
	getWebpackArgs,
	hasBabelConfig,
	hasCssnanoConfig,
	hasEslintConfig,
	hasEslintIgnoreConfig,
	hasJestConfig,
	hasPostCSSConfig,
	hasPrettierConfig,
	hasStylelintConfig,
	hasTsConfig,
	hasWebpackConfig,
} = require( './config' );
const { fromProjectRoot, fromConfigRoot, hasProjectFile } = require( './file' );
const { hasPackageProp, getPackageProp, getPackagePath, getPackage, getPackageVersion } = require( './package' );
const { displayWebpackStats } = require('./webpack');
module.exports = {
	displayWebpackStats,
	fromConfigRoot,
	fromProjectRoot,
	getArgFromCLI,
	getArgsFromCLI,
	getEntryFiles,
	getFileArgsFromCLI,
	getJestOverrideConfigFile,
	getNodeArgsFromCLI,
	getPackage,
	getPackagePath,
	getPackageProp,
	getPackageVersion,
	getScriptsConfig,
	getScriptsPackageBuildConfig,
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
	hasTsConfig,
	hasWebpackConfig,
	spawnScript,
};
