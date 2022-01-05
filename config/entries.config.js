/**
 * External dependencies
 */
const fastGlob = require( 'fast-glob' );
const path = require( 'path' );

const entries = fastGlob
	.sync(
		path.resolve(
			process.cwd(),
			'assets/(js|css|blocks|vendors)/*/!(*.min.*|*.map|_*)(*.js|*.jsx|*.css|*.scss)'
		)
	)
	.reduce( ( memo, file ) => {
		const filename = path.basename( file );
		const name = path
			.parse( filename )
			.name.replace( /[^A-Za-z0-9\s!?]/g, '-' )
			.toLowerCase();

		return {
			...memo,
			[ name ]: file,
		};
	}, {} );

module.exports = entries;
