/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Check if a Tailwind configuration file exists in the given directory.
 * Checks for common Tailwind config file names.
 *
 * @param {string} dir - Directory to check for Tailwind config
 * @return {string|null} Path to Tailwind config file if found, null otherwise
 */
const findTailwindConfig = ( dir ) => {
	const configFiles = [
		'tailwind.config.js',
		'tailwind.config.cjs',
		'tailwind.config.mjs',
		'tailwind.config.ts',
	];

	for ( const configFile of configFiles ) {
		const configPath = path.join( dir, configFile );
		if ( fs.existsSync( configPath ) ) {
			return configPath;
		}
	}

	return null;
};

/**
 * Check if a PostCSS configuration file exists in the given directory.
 * Checks for common PostCSS config file names and package.json postcss property.
 *
 * @param {string} dir - Directory to check for PostCSS config
 * @return {string|null} Path to PostCSS config file if found, null otherwise
 */
const findPostCSSConfig = ( dir ) => {
	const configFiles = [
		'postcss.config.js',
		'postcss.config.cjs',
		'postcss.config.mjs',
		'postcss.config.ts',
		'.postcssrc.js',
		'.postcssrc.cjs',
		'.postcssrc.mjs',
		'.postcssrc.ts',
		'.postcssrc.json',
		'.postcssrc.yml',
		'.postcssrc.yaml',
		'.postcssrc',
	];

	for ( const configFile of configFiles ) {
		const configPath = path.join( dir, configFile );
		if ( fs.existsSync( configPath ) ) {
			return configPath;
		}
	}

	// Check package.json for postcss property
	const packageJsonPath = path.join( dir, 'package.json' );
	if ( fs.existsSync( packageJsonPath ) ) {
		try {
			const packageJson = JSON.parse( fs.readFileSync( packageJsonPath, 'utf8' ) );
			if ( packageJson.postcss ) {
				return packageJsonPath;
			}
		} catch ( error ) {
			// Ignore JSON parsing errors
		}
	}

	return null;
};

/**
 * Check if a PostCSS configuration includes Tailwind CSS.
 * Analyzes the PostCSS config to determine if Tailwind is already configured.
 *
 * @param {string} configPath - Path to PostCSS config file
 * @return {boolean} True if Tailwind is configured, false otherwise
 */
const postCSSConfigHasTailwind = ( configPath ) => {
	try {
		if ( configPath.endsWith( 'package.json' ) ) {
			const packageJson = JSON.parse( fs.readFileSync( configPath, 'utf8' ) );
			const postcssConfig = packageJson.postcss;

			if ( typeof postcssConfig === 'object' && postcssConfig.plugins ) {
				const plugins = postcssConfig.plugins;

				// Check if tailwindcss is in plugins array or object
				if ( Array.isArray( plugins ) ) {
					return plugins.some( ( plugin ) =>
						typeof plugin === 'string' && plugin.includes( 'tailwindcss' ) ||
						typeof plugin === 'object' && plugin.tailwindcss
					);
				} else if ( typeof plugins === 'object' ) {
					return Object.keys( plugins ).some( ( key ) => key.includes( 'tailwindcss' ) );
				}
			}

			return false;
		}

		// For .postcssrc.json files
		if ( configPath.endsWith( '.json' ) ) {
			const config = JSON.parse( fs.readFileSync( configPath, 'utf8' ) );
			if ( config.plugins ) {
				const plugins = config.plugins;
				if ( Array.isArray( plugins ) ) {
					return plugins.some( ( plugin ) =>
						typeof plugin === 'string' && plugin.includes( 'tailwindcss' ) ||
						typeof plugin === 'object' && plugin.tailwindcss
					);
				} else if ( typeof plugins === 'object' ) {
					return Object.keys( plugins ).some( ( key ) => key.includes( 'tailwindcss' ) );
				}
			}
			return false;
		}

		// For JavaScript config files, read as text and check for tailwindcss
		const configContent = fs.readFileSync( configPath, 'utf8' );
		return configContent.includes( 'tailwindcss' );
	} catch ( error ) {
		// If we can't read/parse the config, assume no Tailwind
		return false;
	}
};

/**
 * Create a default PostCSS configuration with Tailwind CSS.
 * Generates a PostCSS config object with common plugins.
 *
 * @param {string} tailwindConfigPath - Absolute path to Tailwind config file
 * @return {Object} PostCSS configuration object
 */
const createDefaultPostCSSConfig = ( tailwindConfigPath ) => {
	return {
		plugins: {
			tailwindcss: tailwindConfigPath ? { config: tailwindConfigPath } : {},
			autoprefixer: {},
		},
	};
};

/**
 * Inject Tailwind CSS into an existing PostCSS configuration.
 * Modifies the PostCSS config to include Tailwind if not already present.
 *
 * @param {string} configPath         - Path to PostCSS config file
 * @param {string} tailwindConfigPath - Path to Tailwind config file
 * @return {boolean} True if injection was successful, false otherwise
 */
const injectTailwindIntoPostCSS = ( configPath, tailwindConfigPath ) => {
	try {
		if ( configPath.endsWith( 'package.json' ) ) {
			const packageJson = JSON.parse( fs.readFileSync( configPath, 'utf8' ) );

			if ( ! packageJson.postcss ) {
				packageJson.postcss = {};
			}

			if ( ! packageJson.postcss.plugins ) {
				packageJson.postcss.plugins = {};
			}

			// Add Tailwind at the beginning of plugins
			const existingPlugins = packageJson.postcss.plugins;
			packageJson.postcss.plugins = {
				tailwindcss: tailwindConfigPath ? { config: tailwindConfigPath } : {},
				...existingPlugins,
			};

			fs.writeFileSync( configPath, JSON.stringify( packageJson, null, 2 ) );
			return true;
		}

		if ( configPath.endsWith( '.json' ) ) {
			const config = JSON.parse( fs.readFileSync( configPath, 'utf8' ) );

			if ( ! config.plugins ) {
				config.plugins = {};
			}

			// Add Tailwind at the beginning of plugins
			const existingPlugins = config.plugins;
			config.plugins = {
				tailwindcss: tailwindConfigPath ? { config: tailwindConfigPath } : {},
				...existingPlugins,
			};

			fs.writeFileSync( configPath, JSON.stringify( config, null, 2 ) );
			return true;
		}

		// For JavaScript files, we'll need to modify the content
		const configContent = fs.readFileSync( configPath, 'utf8' );

		// Get the relative path to the Tailwind config from the PostCSS config directory
		const postCSSDir = path.dirname( configPath );
		const tailwindConfigFilename = path.basename( tailwindConfigPath );

		// Simple injection - add tailwindcss to the beginning of plugins object
		const tailwindPlugin = tailwindConfigPath
			? `tailwindcss: { config: path.join(__dirname, '${ tailwindConfigFilename }') },`
			: `tailwindcss: {},`;

		// Look for plugins object and inject Tailwind
		const pluginsRegex = /plugins:\s*\{/;
		if ( pluginsRegex.test( configContent ) ) {
			// Check if path require already exists
			const hasPathRequire = configContent.includes( "require('path')" );
			const pathRequire = hasPathRequire ? '' : "const path = require('path');\n\n";

			const updatedContent = pathRequire + configContent.replace(
				pluginsRegex,
				`plugins: {\n\t\t${ tailwindPlugin }`
			);
			fs.writeFileSync( configPath, updatedContent );
			return true;
		}

		return false;
	} catch ( error ) {
		return false;
	}
};

/**
 * Create a temporary PostCSS config file for a package.
 * Generates a temporary PostCSS config in the package directory.
 *
 * @param {string} packageDir         - Package directory path
 * @param {string} tailwindConfigPath - Path to Tailwind config file
 * @return {string|null} Path to created PostCSS config file, null if failed
 */
const createTemporaryPostCSSConfig = ( packageDir, tailwindConfigPath ) => {
	try {
		const configPath = path.join( packageDir, 'postcss.config.js' );
		const tailwindConfigFilename = path.basename( tailwindConfigPath );

		const configContent = `const path = require('path');

module.exports = {
	plugins: {
		tailwindcss: { config: path.join(__dirname, '${ tailwindConfigFilename }') },
		autoprefixer: {},
	},
};`;

		fs.writeFileSync( configPath, configContent );

		return configPath;
	} catch ( error ) {
		return null;
	}
};

module.exports = {
	findTailwindConfig,
	findPostCSSConfig,
	postCSSConfigHasTailwind,
	createDefaultPostCSSConfig,
	injectTailwindIntoPostCSS,
	createTemporaryPostCSSConfig,
};
