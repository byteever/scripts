/**
 * External dependencies
 */
const path = require( 'path' );
const camelcase = require('camelcase');
const { existsSync: fileExists } = require('fs');
/**
 * Internal dependencies
 */
const {
	hasArgInCLI,
	getArgFromCLI,
	getArgsFromCLI,
	hasFileArgInCLI,
} = require( './cli' );
const { fromConfigRoot, fromProjectRoot, hasProjectFile } = require( './file' );
const { hasPackageProp, getPackage } = require( './package' );

// See https://babeljs.io/docs/en/config-files#configuration-file-types.
const hasBabelConfig = () =>
	hasProjectFile( '.babelrc.js' ) ||
	hasProjectFile( '.babelrc.json' ) ||
	hasProjectFile( 'babel.config.js' ) ||
	hasProjectFile( 'babel.config.json' ) ||
	hasProjectFile( '.babelrc' ) ||
	hasPackageProp( 'babel' );

// See https://cssnano.co/docs/config-file.
const hasCssnanoConfig = () =>
	hasProjectFile( '.cssnanorc' ) ||
	hasProjectFile( '.cssnanorc.js' ) ||
	hasProjectFile( '.cssnanorc.json' ) ||
	hasProjectFile( '.cssnanorc.yaml' ) ||
	hasProjectFile( '.cssnanorc.yml' ) ||
	hasProjectFile( 'cssnano.config.js' ) ||
	hasPackageProp( 'cssnano' );

// See https://prettier.io/docs/en/configuration.html.
const hasPrettierConfig = () =>
	hasProjectFile( '.prettierrc.js' ) ||
	hasProjectFile( '.prettierrc.json' ) ||
	hasProjectFile( '.prettierrc.toml' ) ||
	hasProjectFile( '.prettierrc.yaml' ) ||
	hasProjectFile( '.prettierrc.yml' ) ||
	hasProjectFile( 'prettier.config.js' ) ||
	hasProjectFile( '.prettierrc' ) ||
	hasPackageProp( 'prettier' );

const hasWebpackConfig = () =>
	hasArgInCLI( '--config' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpack.config.babel.js' );

// See https://github.com/michael-ciniawsky/postcss-load-config#usage (used by postcss-loader).
const hasPostCSSConfig = () =>
	hasProjectFile( 'postcss.config.js' ) ||
	hasProjectFile( '.postcssrc' ) ||
	hasProjectFile( '.postcssrc.json' ) ||
	hasProjectFile( '.postcssrc.yaml' ) ||
	hasProjectFile( '.postcssrc.yml' ) ||
	hasProjectFile( '.postcssrc.js' ) ||
	hasPackageProp( 'postcss' );


const hasStylelintConfig = () =>
	hasProjectFile('.stylelintrc.js') ||
	hasProjectFile('.stylelintrc.json') ||
	hasProjectFile('.stylelintrc.yaml') ||
	hasProjectFile('.stylelintrc.yml') ||
	hasProjectFile('stylelint.config.js') ||
	hasProjectFile('.stylelintrc') ||
	hasPackageProp('stylelint');

const hasEslintConfig = () =>
	hasProjectFile('.eslintrc.js') ||
	hasProjectFile('.eslintrc.json') ||
	hasProjectFile('.eslintrc.yaml') ||
	hasProjectFile('.eslintrc.yml') ||
	hasProjectFile('eslintrc.config.js') ||
	hasProjectFile('.eslintrc') ||
	hasPackageProp('eslintConfig');

// See https://jestjs.io/docs/configuration.
const hasJestConfig = () =>
	hasProjectFile( 'jest.config.js' ) ||
	hasProjectFile( 'jest.config.json' ) ||
	hasProjectFile( 'jest.config.ts' ) ||
	hasPackageProp( 'jest' );

const hasTsConfig = () => hasProjectFile('tsconfig.json');

const hasEslintIgnoreConfig = () => hasProjectFile('.eslintignore');

/**
 * Returns path to a Jest configuration which should be provided as the explicit
 * configuration when there is none available for discovery by Jest in the
 * project environment. Returns undefined if Jest should be allowed to discover
 * an available configuration.
 *
 * This can be used in cases where multiple possible configurations are
 * supported. Since Jest will only discover `jest.config.js`, or `jest` package
 * directive, such custom configurations must be specified explicitly.
 *
 * @param {"e2e"|"unit"} suffix Suffix of configuration file to accept.
 *
 * @return {string=} Override or fallback configuration file path.
 */
function getJestOverrideConfigFile( suffix ) {
	if ( hasArgInCLI( '-c' ) || hasArgInCLI( '--config' ) ) {
		return;
	}

	if ( hasProjectFile( `jest-${ suffix }.config.js` ) ) {
		return fromProjectRoot( `jest-${ suffix }.config.js` );
	}

	if ( ! hasJestConfig() ) {
		return fromConfigRoot( `jest-${ suffix }.config.js` );
	}
}

const getDefaultConfig = () => {
	return {
		entry: require(fromConfigRoot('entries.config.js')),
		filenames: require(fromConfigRoot('filenames.config.js')),
		paths: require(fromConfigRoot('paths.config.js')),
		// true by default (if WP_NO_EXTERNALS is not set)
		// if WP_NO_EXTERNALS is truthy then wpDependencyExternals is false
		wpDependencyExternals:
			typeof process.env.WP_NO_EXTERNALS === 'undefined' ||
			!process.env.WP_NO_EXTERNALS,
	};
};


/**
 * Returns byteever-scripts config from package.json with default values
 *
 * @returns {object}
 */
const getScriptsConfig = () => {
	const packageJson = getPackage();
	const config = packageJson['@byteever/scripts'];
	const defaultConfig = getDefaultConfig();

	if (!config) {
		return defaultConfig;
	}

	return {
		// override default configs with user-defined config
		...defaultConfig,
		...config,
		// these properties must be merged
		filenames: {
			...defaultConfig.filenames,
			...config.filenames,
		},
		paths: {
			...defaultConfig.paths,
			...config.paths,
		},
	};
};

const removeScope = (name) => name.replace(/^@.*\//, '');

const safeVariableName = (name) => {
	const INVALID_ES3_IDENT = /((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g;
	const normalized = removeScope(name).toLowerCase();
	const identifier = normalized.replace(INVALID_ES3_IDENT, '');
	return camelcase(identifier);
};

/**
 * Normalize the package type
 *
 * @param {string} type The user input package type
 *
 * @returns {string} normalized
 */
const normalizePackageType = (type) => {
	switch (type) {
		case 'commonjs':
			return 'commonjs2';
		default:
			return type;
	}
};


/**
 * Returns byteever-scripts configs for package builds. If byteever-scripts is not configured for building packages,
 * this returns false.
 *
 * @returns {object | boolean}
 */
const getScriptsPackageBuildConfig = () => {
	const packageJson = getPackage();
	const config = getScriptsConfig();
	const { name = 'default-package', style } = packageJson;
	const packageType = normalizePackageType(
		getArgFromCLI('-f') || getArgFromCLI('--format') || config.packageType || 'all',
	);
	const source = getArgFromCLI('-i') || getArgFromCLI('--input') || packageJson.source;
	const main = getArgFromCLI('-o') || getArgFromCLI('--output') || packageJson.main;

	let umd = false;
	if (packageType === 'umd' || packageType === 'all') {
		umd = packageJson.unpkg || packageJson['umd:main'] || false;
	}

	// source and main are required
	if (!source || !main) {
		return false;
	}

	let externals = [];

	if (hasArgInCLI('--external')) {
		const external = getArgFromCLI('--external');

		if (external && external !== 'none') {
			externals = external.split(',');
		}
	} else {
		if (packageJson.dependencies) {
			externals = Object.keys(packageJson.dependencies);
		}

		if (packageJson.peerDependencies) {
			externals = [...externals, ...Object.keys(packageJson.peerDependencies)];
		}
	}

	const libraryName = getArgFromCLI('--name') || config.libraryName || safeVariableName(name);

	return {
		source,
		main,
		umd,
		style,
		externals,
		libraryName,
		packageType,
	};
};

const getEntryFiles = () => {
	const { entry } = getScriptsConfig();

	const entries = {};

	Object.keys(entry).forEach((key) => {
		const filePath = path.resolve(process.cwd(), entry[key]);

		if (fileExists(filePath)) {
			entries[key] = filePath;
		}
	});

	return entries;
};

/**
 * Converts CLI arguments to the format which webpack understands.
 *
 * @see https://webpack.js.org/api/cli/#usage-with-config-file
 *
 * @return {Array} The list of CLI arguments to pass to webpack CLI.
 */
const getWebpackArgs = () => {
	// Gets all args from CLI without those prefixed with `--webpack`.
	let webpackArgs = getArgsFromCLI( [ '--webpack' ] );

	const hasWebpackOutputOption =
		hasArgInCLI( '-o' ) || hasArgInCLI( '--output' );
	if (
		! hasWebpackOutputOption &&
		! hasArgInCLI( '--entry' ) &&
		hasFileArgInCLI()
	) {
		/**
		 * Converts a legacy path to the entry pair supported by webpack, e.g.:
		 * `./entry-one.js` -> `[ 'entry-one', './entry-one.js] ]`
		 * `entry-two.js` -> `[ 'entry-two', './entry-two.js' ]`
		 *
		 * @param {string} path The path provided.
		 *
		 * @return {string[]} The entry pair of its name and the file path.
		 */
		const pathToEntry = ( path ) => {
			const entryName = basename( path, '.js' );

			if ( ! path.startsWith( './' ) ) {
				path = './' + path;
			}

			return [ entryName, path ];
		};

		const fileArgs = getFileArgsFromCLI();
		if ( fileArgs.length > 0 ) {
			// Filters out all CLI arguments that are recognized as file paths.
			const fileArgsToRemove = new Set( fileArgs );
			webpackArgs = webpackArgs.filter( ( cliArg ) => {
				if ( fileArgsToRemove.has( cliArg ) ) {
					fileArgsToRemove.delete( cliArg );
					return false;
				}
				return true;
			} );

			// Converts all CLI arguments that are file paths to the `entry` format supported by webpack.
			// It is going to be consumed in the config through the WP_ENTRY global variable.
			const entry = {};
			fileArgs.forEach( ( fileArg ) => {
				const [ entryName, path ] = fileArg.includes( '=' )
					? fileArg.split( '=' )
					: pathToEntry( fileArg );
				entry[ entryName ] = path;
			} );
			process.env.WP_ENTRY = JSON.stringify( entry );
		}
	}

	if ( ! hasWebpackConfig() ) {
		webpackArgs.push( '--config', fromConfigRoot( 'webpack.config.js' ) );
	}

	return webpackArgs;
};


module.exports = {
	getEntryFiles,
	getDefaultConfig,
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
};
