/**
 * Converts dash-delimited string to camelCase.
 *
 * @param {string} input - Dash-delimited string
 * @return {string} Camel-cased string
 * @example
 * camelCaseDash('blocks-navigation') // 'blocksNavigation'
 */
const camelCaseDash = ( input ) =>
	input.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );

/**
 * Extracts package scope from full package name.
 *
 * @param {string} name - Full package name from package.json
 * @return {string|null} Scope string or null if no scope
 * @example
 * getPackageScope('@wp-packages/blocks') // '@wp-packages'
 * getPackageScope('plugin-installer') // null
 */
const getPackageScope = ( name ) =>
	name.startsWith( '@' ) ? name.split( '/' )[ 0 ] : null;

/**
 * Extracts package name from full package name.
 *
 * @param {string} name - Full package name from package.json
 * @return {string} Package name without scope
 * @example
 * getPackageName('@wp-packages/blocks') // 'blocks'
 * getPackageName('plugin-installer') // 'plugin-installer'
 */
const getPackageName = ( name ) =>
	name.startsWith( '@' ) ? name.split( '/' )[ 1 ] : name;

/**
 * Generates namespace string from full package name.
 *
 * @param {string} name - Full package name
 * @return {string} Namespace string with trailing slash or empty string
 * @example
 * getNamespace('@wp-packages/blocks') // '@wp-packages/'
 * getNamespace('plugin-installer') // ''
 */
const getNamespace = ( name ) => {
	const scope = getPackageScope( name );
	return scope ? `${ scope }/` : '';
};

/**
 * Generates external name from full package name.
 *
 * @param {string} name - Full package name
 * @return {string} External name for use in build systems
 * @example
 * getExternalName('@wp-packages/blocks') // 'wp-packages'
 * getExternalName('plugin-installer') // 'plugin-installer'
 */
const getExternalName = ( name ) => {
	const scope = getPackageScope( name );
	return scope ? scope.substring( 1 ) : getPackageName( name );
};

/**
 * Generates handle name from full package name.
 * Currently aliases getExternalName for consistency.
 *
 * @param {string} name - Full package name
 * @return {string} Handle name
 * @example
 * getHandleName('@wp-packages/blocks') // 'wp-packages'
 * getHandleName('plugin-installer') // 'plugin-installer'
 */
const getHandleName = ( name ) => getExternalName( name );

/**
 * Converts string to lowercase with dashes.
 * Handles camelCase and snake_case inputs.
 *
 * @param {string} input - Input string in any case format
 * @return {string} Lowercase dash-delimited string
 * @example
 * lowerCaseDash('CamelCase') // 'camel-case'
 * lowerCaseDash('snake_case') // 'snake-case'
 */
const lowerCaseDash = ( input ) =>
	input
		.replace( /([A-Z])/g, '-$1' )
		.replace( /_/g, '-' )
		.toLowerCase()
		.replace( /^-/, '' );

/**
 * Formats namespace for proper display by removing special characters.
 *
 * @param {string} namespace - Input namespace with potential @ and / characters
 * @return {string} Clean namespace string
 * @example
 * formatNamespace('@wp-packages/') // 'wp-packages'
 * formatNamespace('wp-packages/') // 'wp-packages'
 */
const formatNamespace = ( namespace ) => namespace.replace( /[@/]/g, '' );

module.exports = {
	camelCaseDash,
	formatNamespace,
	getExternalName,
	getHandleName,
	getNamespace,
	getPackageName,
	getPackageScope,
	lowerCaseDash,
};
