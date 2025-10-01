# @byteever/scripts

> Build tools for WordPress plugins and themes - Webpack config wrapper and package transpilation for monorepos

---

## Features

### Webpack Configuration
- Extends `@wordpress/scripts` with intelligent defaults
- Customizable source/output paths (defaults: `resources/` → `assets/`)
- Auto-copy images and fonts
- Bundle optimization (removes empty scripts, trims timezone data)
- Clean progress reporting with WebpackBar

### Package Building (Monorepo Support)
- Transpiles TypeScript/JavaScript packages using Babel
- Compiles SCSS to CSS with RTL support
- Builds both CommonJS (`build/`) and ESM (`build-module/`) outputs
- TypeScript declaration generation
- Watch mode for development
- Works with both monorepos (workspaces) and single packages

---

## Installation

```bash
npm install @byteever/scripts --save-dev
npm install @wordpress/scripts --save-dev
```

---

## Usage

### 1. Webpack Configuration

Create `webpack.config.js` in your project root:

```js
const createConfig = require('@byteever/scripts');
const baseConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = createConfig(baseConfig);
```

**With custom entries:**

```js
module.exports = createConfig(baseConfig, {
  'client/index': './resources/client/index.js',
  'admin/settings': './resources/admin/settings.js',
});
```

**With function-based config override:**

```js
module.exports = createConfig(baseConfig, (config) => ({
  devtool: 'source-map',
  output: {
    ...config.output,
    filename: '[name].[contenthash].js',
  },
}));
```

**Custom paths via CLI:**

```bash
wp-scripts build --source-path=src --output-path=dist
```

Or set environment variables before importing the config (defaults apply if not set).

### 2. Package Building (Monorepo)

Add scripts to your root `package.json`:

```json
{
  "scripts": {
    "build": "byteever-scripts build-package && wp-scripts build",
    "start": "byteever-scripts build-package && concurrently \"byteever-scripts watch-package\" \"wp-scripts start\""
  }
}
```

**Package detection:**

Packages are detected by the presence of a `"module"` field in their `package.json`:

```json
{
  "name": "@myproject/components",
  "version": "1.0.0",
  "main": "build/index.js",
  "module": "build-module/index.js"
}
```

**Monorepo setup (with workspaces):**

```json
{
  "name": "my-plugin",
  "workspaces": ["packages/*"],
  "devDependencies": {
    "@byteever/scripts": "^2.2.0",
    "concurrently": "^9.0.0"
  }
}
```

**Single package setup (no workspaces):**

If your root `package.json` has a `"module"` field, it will be built as a single package.

**Directory structure:**

```
project/
├── packages/
│   ├── components/
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   └── Button.js
│   │   ├── package.json        # Has "module" field
│   │   ├── build/              # Generated (CommonJS)
│   │   └── build-module/       # Generated (ESM)
│   └── data/
│       ├── src/
│       ├── package.json        # Has "module" field
│       ├── build/
│       └── build-module/
├── resources/                   # Webpack assets
├── webpack.config.js
└── package.json
```

---

## CLI Commands

### `byteever-scripts build-package`

Builds packages with a `"module"` field in their `package.json`.

**What it does:**
- Transpiles JS/TS/TSX files from `src/` to `build/` (CommonJS) and `build-module/` (ESM)
- Compiles SCSS files to CSS with automatic RTL generation in `build-style/`
- Copies JSON files
- Generates TypeScript declarations (if `tsconfig.json` exists)

**File extensions handled:**
- `.js`, `.ts`, `.tsx` → Babel transpilation
- `.scss` → Sass compilation + PostCSS + RTL
- `.json` → Direct copy

### `byteever-scripts watch-package`

Same as `build-package` but watches for file changes and rebuilds incrementally.

---

## Package Build Output

Given this source structure:

```
packages/components/src/
├── index.js
├── Button.js
└── styles.scss
```

Build produces:

```
packages/components/
├── build/                # CommonJS
│   ├── index.js
│   ├── index.js.map
│   ├── Button.js
│   └── Button.js.map
├── build-module/         # ESM
│   ├── index.js
│   ├── index.js.map
│   ├── Button.js
│   └── Button.js.map
└── build-style/          # CSS
    ├── styles.css
    └── styles-rtl.css
```

---

## Webpack Plugins Included

- `webpackbar` - Clean progress bar
- `copy-webpack-plugin` - Auto-copy images/fonts
- `webpack-remove-empty-scripts` - Removes empty JS from CSS-only entries
- `moment-timezone-data-webpack-plugin` - Reduces timezone data (from year 2000)

---

## Environment Variables

- `WP_SOURCE_PATH` - Source directory (default: `resources`)
- `WP_OUTPUT_PATH` - Output directory (default: `assets`)
- `NODE_ENV` - Set to `development` to build only ESM for packages

---

## Configuration Options

### Webpack Config Override

**Object (replaces entries):**

```js
module.exports = createConfig(baseConfig, {
  'app': './src/app.js',
});
```

**Function (merges with base config):**

```js
module.exports = createConfig(baseConfig, (config) => ({
  devtool: 'source-map',
}));
```

### Package Building

**In package.json:**

```json
{
  "name": "@myproject/utils",
  "version": "1.0.0",
  "main": "build/index.js",
  "module": "build-module/index.js"
}
```

The `"module"` field is **required** for the package to be detected and built.

---

## Examples

### Example 1: Plugin with Monorepo

```json
{
  "name": "my-plugin",
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "byteever-scripts build-package && wp-scripts build",
    "start": "byteever-scripts build-package && concurrently \"byteever-scripts watch-package\" \"wp-scripts start\""
  }
}
```

### Example 2: Single Package

```json
{
  "name": "@myorg/library",
  "main": "build/index.js",
  "module": "build-module/index.js",
  "scripts": {
    "build": "byteever-scripts build-package"
  }
}
```

### Example 3: Custom Webpack Entry

```js
// webpack.config.js
const createConfig = require('@byteever/scripts');
const baseConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = createConfig(baseConfig, {
  'client/index': './resources/client/index.js',
});
```

---

## Author

Built by [ByteEver](https://byteever.com)

## License

MIT