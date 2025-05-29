#!/bin/sh
# Exit if any command fails.
set -e

VERSION=$(node -p "require('./package.json').version")
# Show the release version and ask for confirmation.
echo "➤ Preparing release for $VERSION..."
read -p "Are you sure you want to release version $VERSION? (y/n) " -n 1 -r
echo ""

# Push the changes to the repository.
echo "➤ Pushing changes to the repository..."
git add .
git commit -m "Update version to $VERSION"
git push origin master
echo "✓ Changes pushed to the repository!"

# create a github release
echo "➤ Creating GitHub release..."
git add .
git commit -m "Release v$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin master --tags
echo "✓ GitHub release created!"

# Release the package to npm.
echo "➤ Releasing package to npm..."
npm publish --access public
echo "✓ Package released to npm!"
