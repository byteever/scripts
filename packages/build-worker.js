const { promisify } = require( 'util' );
const fs = require( 'fs' );
const path = require( 'path' );
const babel = require( '@babel/core' );
const makeDir = require( 'make-dir' );
const sass = require( 'sass' );
const postcss = require( 'postcss' );
const getBabelConfig = require( './get-babel-config' );

const isDev = process.env.NODE_ENV === 'development';

const readFile = promisify( fs.readFile );
const writeFile = promisify( fs.writeFile );
const renderSass = promisify( sass.render );

const JS_ENVIRONMENTS = isDev
	? { module: 'build-module' }
	: {
			main: 'build',
			module: 'build-module',
	  };

function getPackageRoot( file ) {
	let currentDir = path.dirname( file );
	while ( currentDir !== path.parse( currentDir ).root ) {
		const packageJsonPath = path.resolve( currentDir, 'package.json' );
		if ( fs.existsSync( packageJsonPath ) ) {
			return currentDir;
		}
		currentDir = path.dirname( currentDir );
	}
	return null;
}

function getBuildPath( file, buildFolder ) {
	const pkgRoot = getPackageRoot( file );
	if ( ! pkgRoot ) {
		throw new Error( `Could not find package root for file: ${ file }` );
	}

	const pkgSrcPath = path.resolve( pkgRoot, 'src' );
	const pkgBuildPath = path.resolve( pkgRoot, buildFolder );
	const relativeToSrcPath = path.relative( pkgSrcPath, file );
	return path.resolve( pkgBuildPath, relativeToSrcPath );
}

async function buildCSS( file ) {
	const outputFile = getBuildPath(
		file.replace( '.scss', '.css' ),
		'build-style'
	);
	const outputFileRTL = getBuildPath(
		file.replace( '.scss', '-rtl.css' ),
		'build-style'
	);

	const [ , contents ] = await Promise.all( [
		makeDir( path.dirname( outputFile ) ),
		readFile( file, 'utf8' ),
	] );

	const builtSass = await renderSass( {
		file,
		data: contents,
	} );

	let postcssPlugins = [ require( 'postcss-local-keyframes' ) ];

	try {
		const wordpressPostcssPreset = require( '@wordpress/postcss-plugins-preset' );
		postcssPlugins.push( ...wordpressPostcssPreset );
	} catch ( e ) {}

	const result = await postcss( postcssPlugins ).process( builtSass.css, {
		from: file,
		to: outputFile,
	} );

	const resultRTL = await postcss( [ require( 'rtlcss' )() ] ).process(
		result.css,
		{
			from: outputFile,
			to: outputFileRTL,
		}
	);

	await Promise.all( [
		writeFile( outputFile, result.css ),
		writeFile( outputFileRTL, resultRTL.css ),
	] );
}

async function buildJS( file ) {
	const pkgRoot = getPackageRoot( file );

	for ( const [ environment, buildDir ] of Object.entries(
		JS_ENVIRONMENTS
	) ) {
		const destPath = getBuildPath(
			file.replace( /\.tsx?$/, '.js' ),
			buildDir
		);
		const babelOptions = getBabelConfig(
			environment,
			file.replace( pkgRoot, path.basename( pkgRoot ) )
		);

		const [ , transformed ] = await Promise.all( [
			makeDir( path.dirname( destPath ) ),
			babel.transformFileAsync( file, babelOptions ),
		] );

		await Promise.all( [
			writeFile( destPath + '.map', JSON.stringify( transformed.map ) ),
			writeFile(
				destPath,
				transformed.code +
					'\n//# sourceMappingURL=' +
					path.basename( destPath ) +
					'.map'
			),
		] );
	}
}

async function buildJSON( file ) {
	const destPath = getBuildPath( file, 'build' );
	await makeDir( path.dirname( destPath ) );
	const contents = await readFile( file, 'utf8' );
	await writeFile( destPath, contents );
}

const BUILD_TASK_BY_EXTENSION = {
	'.scss': buildCSS,
	'.js': buildJS,
	'.ts': buildJS,
	'.tsx': buildJS,
	'.json': buildJSON,
};

module.exports = async ( file, callback ) => {
	const extension = path.extname( file );
	const task = BUILD_TASK_BY_EXTENSION[ extension ];

	if ( ! task ) {
		callback( new Error( `No handler for extension: ${ extension }` ) );
		return;
	}

	try {
		await task( file );
		callback();
	} catch ( error ) {
		callback( error );
	}
};