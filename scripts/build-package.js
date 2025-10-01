#!/usr/bin/env node

const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'fast-glob' );
const ProgressBar = require( 'progress' );
const workerFarm = require( 'worker-farm' );
const { Readable, Transform } = require( 'stream' );
const { spawn } = require( 'child_process' );
const chalk = require( 'chalk' );
const getPackages = require( '../packages/get-packages' );

const args = process.argv.slice( 2 );
const packages = getPackages();

if ( ! packages.length ) {
	console.error( 'No packages found to build.' );
	console.log( 'Make sure your package has a "module" field in package.json.' );
	process.exit( 1 );
}

const stylesheetEntryPoints = packages.reduce( ( acc, pkg ) => {
	const srcPath = path.resolve( pkg, 'src' );
	if ( fs.existsSync( srcPath ) ) {
		const entries = glob.sync( path.resolve( srcPath, '*.scss' ) );
		acc.push( ...entries );
	}
	return acc;
}, [] );

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

function parseImportStatements( file ) {
	const fileContent = fs.readFileSync( file, 'utf8' );
	return fileContent.toString().match( /@import "(.*?)"/g );
}

function isFileImportedInStyleEntry( file, importStatements ) {
	const pkgRoot = getPackageRoot( file );
	if ( ! pkgRoot ) {
		return false;
	}
	const pkgName = path.basename( pkgRoot );
	const regex = new RegExp( `/${ pkgName }/`, 'g' );

	return (
		importStatements &&
		importStatements.find( ( importStatement ) =>
			importStatement.match( regex )
		)
	);
}

function findStyleEntriesThatImportFile( file ) {
	return stylesheetEntryPoints.reduce(
		(acc, entryPoint) => {
			const styleEntryImportStatements =
				parseImportStatements(entryPoint);

			if (
				isFileImportedInStyleEntry(file, styleEntryImportStatements)
			) {
				acc.push(entryPoint);
			}

			return acc;
		},
		[]
	);
}

function createStyleEntryTransform() {
	const processedPackages = new Set();

	return new Transform( {
		objectMode: true,
		async transform( file, encoding, callback ) {
			if ( path.extname( file ) !== '.scss' ) {
				this.push( file );
				callback();
				return;
			}

			const pkgRoot = getPackageRoot( file );
			if ( ! pkgRoot || processedPackages.has( pkgRoot ) ) {
				callback();
				return;
			}

			processedPackages.add( pkgRoot );
			const entries = await glob(
				path.resolve( pkgRoot, 'src', '*.scss' )
			);

			entries.forEach( ( entry ) => this.push( entry ) );

			callback();
		},
	} );
}

let onFileComplete = () => {};
let files = [];
let stream;

if ( args.length ) {
	stream = new Readable( { encoding: 'utf8' } );
	args.forEach( ( file ) => {
		stream.push( file );
	} );

	stream.push( null );
	stream = stream.pipe( createStyleEntryTransform() );
} else {
	const bar = new ProgressBar( 'Build Progress: [:bar] :percent', {
		width: 30,
		incomplete: ' ',
		total: 1,
	} );

	bar.tick( 0 );

	const globPatterns = packages.reduce( ( acc, pkg ) => {
		const srcPath = path.resolve( pkg, 'src' );
		if ( fs.existsSync( srcPath ) ) {
			acc.push( path.resolve( srcPath, '**/*.{js,ts,tsx,json}' ) );
			acc.push( path.resolve( srcPath, '*.scss' ) );
		}
		return acc;
	}, [] );

	stream = glob.stream( globPatterns, {
		ignore: [
			'**/benchmark/**',
			'**/{__mocks__,__tests__,test}/**',
			'**/{storybook,stories}/**',
			'**/*.{spec,test}.{js,ts,tsx}',
		],
		onlyFiles: true,
	} );

	stream.pause().on( 'data', ( file ) => {
		bar.total = files.push( file );
	} );

	onFileComplete = () => {
		bar.tick();
	};
}

const worker = workerFarm( require.resolve( '../packages/build-worker' ) );

let ended = false,
	complete = 0;

stream
	.on( 'data', ( file ) =>
		worker( file, ( error ) => {
			onFileComplete();

			if ( error ) {
				process.exitCode = 1;
				console.error( error );
			}

			++complete;
			if ( ended && complete === files.length ) {
				workerFarm.end( worker );
				buildTypeDeclarations();
			}
		} )
	)
	.on( 'end', () => ( ended = true ) )
	.resume();

function buildTypeDeclarations() {
	const packagesWithTypes = packages.filter( ( pkg ) => {
		const tsconfigPath = path.resolve( pkg, 'tsconfig.json' );
		return fs.existsSync( tsconfigPath );
	} );

	if ( packagesWithTypes.length === 0 ) {
		return;
	}

	console.log(
		chalk.cyan( '\nGenerating TypeScript declarations...' )
	);

	const tscPath = require.resolve( 'typescript/bin/tsc' );

	packagesWithTypes.forEach( ( pkg ) => {
		const tsconfigPath = path.resolve( pkg, 'tsconfig.json' );
		const pkgName = path.basename( pkg );

		const tsc = spawn(
			'node',
			[ tscPath, '--project', tsconfigPath ],
			{ stdio: 'inherit' }
		);

		tsc.on( 'close', ( code ) => {
			if ( code !== 0 ) {
				console.error(
					chalk.red( `Failed to generate types for ${ pkgName }` )
				);
			}
		} );
	} );
}