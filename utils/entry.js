/**
 * External dependencies
 */
const path = require( 'path' );
const { glob } = require( 'glob' );

/**
 * Internal dependencies
 */
const { readPackageFromDirectory } = require( './package' );
const {
	getPackageScope,
	getPackageName,
	getNamespace,
	getExternalName,
	getHandleName,
} = require( './strings' );

/**
 * Try multiple glob patterns in order until a match is found.
 * Optimized to return early on first match for better performance.
 *
 * @param {string}   sourcePath - Source directory path
 * @param {string[]} patterns   - List of glob patterns relative to sourcePath
 * @return {string[]} Matched file paths (absolute paths)
 * @example
 * globFiles('/src', ['*.js', '*.jsx']) // ['/src/app.js', '/src/component.jsx']
 */
const globFiles = ( sourcePath, patterns ) => {
	for ( const pattern of patterns ) {
		const matches = glob.sync( path.join( sourcePath, pattern ), {
			absolute: true,
			cwd: sourcePath,
		} );
		if ( matches.length > 0 ) {
			return matches;
		}
	}
	return [];
};

/**
 * Get asset entries from a directory with optimized entry name generation.
 * Processes glob patterns to create webpack entry points.
 *
 * @param {string}          sourcePath - Source directory path
 * @param {Array<string[]>} patterns   - Array of glob pattern arrays to match files
 * @return {Object} Object with entry name as key and file path as value
 * @example
 * getAssets('/src', [['scripts/*.js'], ['styles/*.css']])
 * // { 'scripts/app': '/src/scripts/app.js', 'styles/main': '/src/styles/main.css' }
 */
const getAssets = ( sourcePath, patterns ) => {
	return patterns.reduce( ( assets, patternArray ) => {
		const files = globFiles( sourcePath, patternArray );

		return files.reduce( ( acc, file ) => {
			const relativePath = path.relative( sourcePath, file );
			const fileName = path.basename( file, path.extname( file ) );
			const pathParts = relativePath.split( path.sep );
			const baseDirectory = pathParts[ 0 ];

			// Filter out empty parts and remove redundant nested parts
			const validParts = pathParts.filter( Boolean );
			const filteredParts = validParts.filter( ( part, index ) => {
				return ! validParts.some(
					( otherPart, otherIndex ) =>
						otherIndex !== index &&
						otherPart &&
						otherPart !== part &&
						otherPart.includes( part )
				);
			} );

			// Generate optimized entry name
			const entryName = filteredParts.length > 1
				? `${ filteredParts[ 0 ] }/${ filteredParts.slice( 1, -1 ).join( '-' ) }${ filteredParts.length > 2 ? '-' : '' }${ fileName }`
				: `${ baseDirectory }/${ fileName }`;

			if ( entryName ) {
				acc[ entryName ] = path.resolve( file );
			}

			return acc;
		}, assets );
	}, {} );
};

/**
 * Get package entries with enhanced validation and error handling.
 * Scans for package.json files and creates package metadata objects.
 *
 * @param {string}          sourcePath - Source directory path
 * @param {Array<string[]>} patterns   - Array of glob pattern arrays to match package.json files
 * @return {Array<Object>} Array of package metadata objects
 * @example
 * getPackages('/src', [['packages/*\/package.json']])
 * // [{ name: '@scope/package', scope: '@scope', packageName: 'package', ... }]
 */
const getPackages = ( sourcePath, patterns ) => {
	return patterns.reduce( ( packages, patternArray ) => {
		const packageFiles = globFiles( sourcePath, patternArray );

		const validPackages = packageFiles
			.map( ( file ) => {
				const packageData = readPackageFromDirectory( path.dirname( file ) );

				// Enhanced validation for package.json structure
				if ( ! packageData?.packageJson?.main || ! packageData?.packageJson?.name ) {
					return null;
				}

				const { name, main } = packageData.packageJson;
				const packageDir = path.dirname( file );
				const mainPath = path.resolve( packageDir, main );

				return {
					name,
					scope: getPackageScope( name ),
					packageName: getPackageName( name ),
					namespace: getNamespace( name ),
					externalName: getExternalName( name ),
					handleName: getHandleName( name ),
					main: mainPath,
					path: packageData.path,
					packageJson: packageData.packageJson,
				};
			} )
			.filter( Boolean );

		return [ ...packages, ...validPackages ];
	}, [] );
};

module.exports = {
	getAssets,
	getPackages,
	globFiles,
};
