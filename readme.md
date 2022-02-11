# ByteEver Scripts
A collection of bundled scripts for WordPress development.

## Installation

You only need to install one npm module:

```bash
npm install git+ssh://git@github.com:byteever/scripts.git --save-dev
```

**Note**: This package requires Node.js 12.13.0 or later, and `npm` 6.9.0 or later. It is not compatible with older versions.

## Setup

_Example:_

```json
{
	"scripts": {
		"watch": "byteever-scripts start",
		"build": "byteever-scripts build",
		"format": "byteever-scripts format-js",
		"lint": "npm run lint:js && npm run lint:css && npm run lint:pkg-json && npm run lint:md",
		"lint:js": "byteever-scripts lint-js  --fix",
		"lint:css": "byteever-scripts lint-style --fix",
		"lint:pkg-json": "byteever-scripts lint-pkg-json",
		"lint:md": "byteever-scripts lint-md-docs",
		"analyze-bundles": "byteever-scripts build --webpack-bundle-analyzer",
		"check-engines": "byteever-scripts check-engines",
		"check-licenses": "byteever-scripts check-licenses",
		"packages-update": "byteever-scripts packages-update",
		"test:e2e": "byteever-scripts test-e2e",
		"test:unit": "byteever-scripts test-unit-js"
	}
}
```

### Entry points
This package uses Webpack under the hood and uses the following entry points:
```
[
'assets/js/*.js',
'assets/css/*.scss',
'assets/fronts/*',
'assets/images/*',
]

### Browsersync

```json
{
     "devURL": "https://project.test"
}
```

### Webpack

Here's an example `webpack.config.js` you could add to the root of your project to extend `@byteever/scripts` Webpack.

```js
const defaultConfig = require('@byteever/scripts/config/webpack.config');
module.exports = {
	...defaultConfig,
	myObject: {
        stuffHere: true
    }
};
```
