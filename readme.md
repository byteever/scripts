# @byteever/scripts

Zero-config [`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) wrapper for ByteEver plugins.

## What it does

- Source at `assets/src/`, output at `assets/build/` — no flags, no config.
- Copies block `block.json` and PHP files (`render.php`) into the build.
- One builder call returns what webpack consumes — object or `[ scripts, modules ]` — so plugins never branch on the shape.
- Entries are declared explicitly in `webpack.config.js`; block entries come from `block.json`.
- Emits async chunks to `chunks/`.
- Replaces the `byteever` text domain with the plugin's own domain in vendor PHP, project JS, and `@byteever/*` packages.
- Extended dependency extraction for cross-plugin shared libraries.

## Setup

`webpack.config.js`:

```js
module.exports = require( '@byteever/scripts' )( {
	entry: {
		admin: './assets/src/admin/index.js',
		frontend: './assets/src/frontend/index.js',
	},
} );
```

A blocks-only plugin passes nothing: `require( '@byteever/scripts' )()`.

`package.json`:

```json
{
	"scripts": {
		"start": "wp-scripts start --experimental-modules --blocks-manifest",
		"build": "wp-scripts build --experimental-modules --blocks-manifest"
	}
}
```

## Options

- `entry` — entry points; a string path, or a webpack entry descriptor for producers exposing a shared library:

```js
module.exports = require( '@byteever/scripts' )( {
	entry: {
		shared: {
			import: './assets/src/shared/index.js',
			library: { name: [ 'byteever', 'shared' ], type: 'window' },
		},
	},
} );
```

- `externals` — scoped packages consumed from another plugin's shared library; handles are written into `.asset.php` as `{scope}-{name}`:

```js
module.exports = require( '@byteever/scripts' )( {
	externals: { '@byteever/shared': [ 'byteever', 'shared' ] },
} );
```

The text domain is detected from `textDomain`, falling back to `name`.
