const { spawn } = require( 'child_process' );
const path = require( 'path' );

function getNodeArgsFromCLI() {
	const args = process.argv.slice( 2 );
	const scriptName = args[ 0 ];
	const scriptArgs = args.slice( 1 );
	const nodeArgs = [];

	return { scriptName, scriptArgs, nodeArgs };
}

function spawnScript( scriptName, scriptArgs = [], nodeArgs = [] ) {
	if ( ! scriptName ) {
		console.error( 'No script name provided.' );
		process.exit( 1 );
	}

	const scriptPath = path.resolve( __dirname, '../scripts', `${ scriptName }.js` );

	const child = spawn(
		'node',
		[ ...nodeArgs, scriptPath, ...scriptArgs ],
		{ stdio: 'inherit' }
	);

	child.on( 'exit', ( code ) => {
		process.exit( code );
	} );
}

module.exports = {
	getNodeArgsFromCLI,
	spawnScript,
};