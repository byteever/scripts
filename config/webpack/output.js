/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = ( { isPackage, projectConfig: { filenames } } ) => {
	if ( isPackage ) {
		return {
			path: path.resolve( process.cwd(), 'dist' ),
		};
	}

	return {
		clean: true,
		path: path.resolve( process.cwd(), 'dist' ),
		chunkFilename: filenames.jsChunk,
		filename: filenames.js,
	};
};
