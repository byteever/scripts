/**
 * External dependencies
 */
const { realpathSync } = require( 'fs' );
const { readPackageUpSync } = require( 'read-package-up' );

/**
 * Cached package.json data for the current working directory
 */
const packageData = readPackageUpSync( {
	cwd: realpathSync( process.cwd() ),
} );

/**
 * Get the path to package.json file.
 *
 * @return {string|null} Path to package.json or null if not found
 * @example
 * getPackagePath() // '/path/to/project/package.json'
 */
const getPackagePath = () => packageData?.path || null;

/**
 * Get a property from package.json with type safety.
 *
 * @param {string} prop - Property name to retrieve
 * @return {*} Property value or undefined if not found
 * @example
 * getPackageProp('name') // 'my-package'
 * getPackageProp('version') // '1.0.0'
 */
const getPackageProp = ( prop ) => packageData?.packageJson?.[ prop ];

/**
 * Check if package.json has a specific property.
 *
 * @param {string} prop - Property name to check
 * @return {boolean} True if property exists, false otherwise
 * @example
 * hasPackageProp('scripts') // true
 * hasPackageProp('nonexistent') // false
 */
const hasPackageProp = ( prop ) =>
	Object.prototype.hasOwnProperty.call( packageData?.packageJson || {}, prop );

/**
 * Read package.json from a specific directory with enhanced error handling.
 *
 * @param {string} cwd - Directory path to search for package.json
 * @return {Object|null} Package data object or null if not found/invalid
 * @example
 * readPackageFromDirectory('/path/to/package')
 * // { packageJson: {...}, path: '/path/to/package/package.json' }
 */
const readPackageFromDirectory = ( cwd ) => {
	try {
		return readPackageUpSync( { cwd } );
	} catch {
		return null;
	}
};

module.exports = {
	getPackagePath,
	getPackageProp,
	hasPackageProp,
	readPackageFromDirectory,
};
