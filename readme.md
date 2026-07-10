# @byteever/scripts

Webpack configuration wrapper for WordPress plugins extending `@wordpress/scripts`.

## Installation

```bash
npm install @byteever/scripts @wordpress/scripts --save-dev
```

## Usage

### Webpack Configuration

Use the pre-configured webpack config in your `webpack.config.js`:

```js
const baseConfig = require('@byteever/scripts/config/webpack.config');

module.exports = {
  ...baseConfig,
  entry: {
    ...baseConfig.entry,
    'client/index': './assets/src/client/index.js',
  },
};
```

## Features

### Pre-configured Webpack
- Extends `@wordpress/scripts` webpack config
- Default paths: `assets/src/` → `assets/build/` (via `WP_SOURCE_PATH` env var)
- Chunks output to `chunks/` subdirectory
- Clean stats output

### Plugins Included
- **TextDomainPlugin** - Replaces `byteever` text domain in PHP vendor files and JS assets
- **ScriptExternalsPlugin** - Handles custom script externals for shared libraries
- **RtlChunkCleanupPlugin** - Removes RTL CSS from chunks (keeps only entry points)
- **CopyWebpackPlugin** - Auto-copies images and fonts
- **MomentTimezoneDataPlugin** - Reduces timezone data size
- **RemoveEmptyScriptsPlugin** - Cleans up empty JS from CSS-only entries
- **WebpackBar** - Clean progress bar

### Script Externals

Share JavaScript libraries across plugins using webpack externals:

**Producer** (exposes library on window):
```js
// webpack.config.js
module.exports = {
  ...baseConfig,
  entry: {
    shared: {
      import: './assets/src/shared.js',
      library: { name: ['starter', 'shared'], type: 'window' },
    },
  },
};
```

**Consumer** (imports from window):
```js
// webpack.config.js
module.exports = {
  ...baseConfig,
  externals: {
    ...baseConfig.externals,
    '@starter/shared': ['starter', 'shared'],
  },
};
```

The `ScriptExternalsPlugin` automatically generates correct WordPress script handles in `.asset.php` files.

## Configuration

### Extend Config

Add custom webpack configuration:

```js
const baseConfig = require('@byteever/scripts/config/webpack.config');

module.exports = {
  ...baseConfig,
  devtool: 'source-map',
  // ... custom config
};
```

## License

GPL-2.0-or-later
