#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

show_help() {
    echo "Usage: $0 <command> -v <version> [options]"
    echo ""
    echo "Commands:"
    echo "  package             Package extension only"
    echo "  release             Package extension and create git tag"
    echo ""
    echo "Required:"
    echo "  -v, --version       Version to set (e.g., 1.4.0)"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 package -v 1.4.0     # Package extension with version 1.4.0"
    echo "  $0 release -v 1.4.0     # Package and create git tag v1.4.0"
}

error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info_msg() {
    echo -e "${GREEN}📋 $1${NC}"
}

check_project_root() {
    if [[ ! -f "package.json" ]]; then
        error_exit "package.json not found. Run this script from project root directory."
    fi

    if [[ ! -f "manifest.json" ]]; then
        error_exit "manifest.json not found. This is not a Chrome extension project."
    fi

    success_msg "Project root directory confirmed: $(pwd)"
}

update_version() {
    local version="$1"

    info_msg "Updating version to ${version}"

    # Update package.json (use sed to preserve formatting)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": *\"[^\"]*\"/\"version\": \"$version\"/" package.json
    else
        # Linux
        sed -i "s/\"version\": *\"[^\"]*\"/\"version\": \"$version\"/" package.json
    fi

    # Update manifest.json (use sed to preserve formatting)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": *\"[^\"]*\"/\"version\": \"$version\"/" manifest.json
    else
        # Linux
        sed -i "s/\"version\": *\"[^\"]*\"/\"version\": \"$version\"/" manifest.json
    fi

    success_msg "Version updated in package.json and manifest.json"
}

check_git_tag() {
    local tag="v$1"

    if git tag -l | grep -q "^${tag}$"; then
        error_exit "Git tag ${tag} already exists!"
    fi
}

check_uncommitted_changes() {
    info_msg "Checking for uncommitted changes"

    if ! git diff-index --quiet HEAD --; then
        error_exit "You have uncommitted changes. Please commit or stash them before creating a release."
    fi

    success_msg "Working directory is clean"
}

commit_version_changes() {
    local version="$1"

    info_msg "Committing version changes"

    git add package.json manifest.json
    git commit -m "Bump version to ${version}"

    success_msg "Version changes committed"
}

package_extension() {
    local version="$1"

    info_msg "Creating dist directory"
    rm -rf dist
    mkdir -p dist

    info_msg "Copying extension files"

    # Copy core files
    cp manifest.json dist/
    cp popup.html dist/

    # Copy directories if they exist
    for dir in images css js; do
        if [[ -d "$dir" ]]; then
            cp -r "$dir" dist/
        fi
    done

    # Create zip file
    local zip_name="WHU-GPA-helperX-v${version}.zip"
    info_msg "Creating zip file: ${zip_name}"

    (cd dist && zip -r "../dist/${zip_name}" ./* >/dev/null)

    success_msg "Extension packaged successfully!"
    echo "   📁 Package: dist/${zip_name}"
    echo "   📏 Size: $(du -h "dist/${zip_name}" | cut -f1)"
}

create_git_tag() {
    local version="$1"
    local tag="v${version}"

    info_msg "Creating git tag: ${tag}"

    git tag -a "${tag}" -m "Release ${tag}"
    success_msg "Git tag ${tag} created successfully!"
    warn_msg "Don't forget to push the tag: git push origin ${tag}"
}

# Parse arguments
COMMAND=""
VERSION=""

if [[ $# -eq 0 ]]; then
    show_help
    exit 1
fi

# First argument should be command
case "$1" in
    package|release)
        COMMAND="$1"
        shift
        ;;
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        error_exit "Invalid command: $1. Use 'package' or 'release'"
        ;;
esac

# Parse remaining arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            if [[ -z "$VERSION" ]]; then
                error_exit "Version cannot be empty"
            fi
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            error_exit "Unknown option: $1"
            ;;
    esac
done

# Validate required arguments
if [[ -z "$VERSION" ]]; then
    error_exit "Version is required. Use -v or --version"
fi

# Validate version format (basic check)
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    error_exit "Invalid version format. Use semantic versioning (e.g., 1.4.0)"
fi

# Main execution
info_msg "Starting Chrome Extension ${COMMAND} process"

check_project_root

if [[ "$COMMAND" == "release" ]]; then
    check_git_tag "$VERSION"
    # Check for uncommitted changes before making any modifications
    check_uncommitted_changes
fi

update_version "$VERSION"
package_extension "$VERSION"

if [[ "$COMMAND" == "release" ]]; then
    commit_version_changes "$VERSION"
    create_git_tag "$VERSION"
fi

success_msg "${COMMAND^} process completed!"

if [[ "$COMMAND" == "package" ]]; then
    echo ""
    echo "Next steps:"
    echo "  1. Test the extension by loading dist/ folder in Chrome"
    echo "  2. Upload WHU-GPA-helperX-v${VERSION}.zip to Chrome Web Store"
else
    echo ""
    echo "Next steps:"
    echo "  1. Push the git tag: git push origin v${VERSION}"
    echo "  2. GitHub Actions will automatically create a release"
    echo "  3. Extension will be uploaded to Chrome Web Store"
fi
