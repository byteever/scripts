#!/usr/bin/env node

const { getNodeArgsFromCLI, spawnScript } = require( '../utils/cli' );

const { scriptName, scriptArgs, nodeArgs } = getNodeArgsFromCLI();

spawnScript( scriptName, scriptArgs, nodeArgs );