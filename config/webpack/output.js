/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = ( { isPackage } ) => {
	if ( isPackage ) {
		return {
			path: path.resolve( process.cwd(), 'dist' ),
		};
	}

	return {
		clean: true,
		path: path.resolve( process.cwd(), 'dist' ),
		chunkFilename: 'js/[name].[contenthash].chunk.js',
		filename: 'js/[name].js',
	};
};
