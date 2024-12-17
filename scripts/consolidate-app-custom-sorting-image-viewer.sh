#!/bin/zsh

set -u  # Exit on undefined variable

# System commands with full paths
LS="/bin/ls"
CAT="/bin/cat"
RM="/bin/rm"
CP="/bin/cp"
MKDIR="/bin/mkdir"
FIND="/usr/bin/find"
DATE="/bin/date"
WC="/usr/bin/wc"
TOUCH="/usr/bin/touch"

# Debug function
debug() {
    echo "DEBUG: $1" >&2
}

# Display usage information
usage() {
    echo "Usage: $0 <source_directory> [output_directory] [--exclude paths...] [additional_paths...]"
    echo
    echo "Arguments:"
    echo "  source_directory    Directory containing source files to process"
    echo "  output_directory    (Optional) Directory to store output files"
    echo "                      Default: /Users/adamchenwei/www/rest-reminder-electron/promptSource"
    echo "  --exclude          (Optional) Paths to exclude from processing"
    echo "  additional_paths    (Optional) Additional files or directories to process"
    echo
    echo "Example usage:"
    echo "  $0 ./src                                    # Use default output directory"
    echo "  $0 ./src ./output                          # Specify custom output directory"
    echo "  $0 ./src --exclude node_modules dist       # Exclude specific directories"
    echo "  $0 ./src ./output --exclude tests cache    # Exclude with custom output"
    exit 1
}

# Changed to array of extensions to support both .ts and .tsx
declare -a FILE_EXTENSIONS=(".ts" ".tsx")
OUTPUT_PREFIX="promptSource"
TIMESTAMP_FORMAT="%m-%d-%H-%M"
MAX_SIZE_MB=5
MAX_SIZE_BYTES=$((MAX_SIZE_MB * 1024 * 1024))

# Default output directory
DEFAULT_OUTPUT_DIR="/Users/adamchenwei/www/custom-sorting-image-viewer/promptSource"

# Array to store excluded paths
declare -a EXCLUDED_PATHS=()

declare -a customTextList=(
    ""
    "This app uses typescript and nodejs v20"
    ""
)

declare -a externalLibs=(
    "/Users/adamchenwei/www/custom-sorting-image-viewer/app"
    "/Users/adamchenwei/www/custom-sorting-image-viewer/tsconfig.json"
    "/Users/adamchenwei/www/custom-sorting-image-viewer/package.json"

)

# Function to resolve relative paths to absolute paths
resolve_path() {
    local path="$1"
    if [[ ! "$path" = /* ]]; then
        path="$(cd "$(dirname "$path")" && pwd)/$(basename "$path")"
    fi
    echo "$path"
}

# Function to check if path should be excluded
should_exclude() {
    local check_path="$1"
    for excluded in "${EXCLUDED_PATHS[@]}"; do
        if [[ "$check_path" == *"$excluded"* ]]; then
            return 0  # true, should exclude
        fi
    done
    return 1  # false, should not exclude
}

# Function to process a single file
process_file() {
    local file="$1"
    if [[ ! "$file" =~ "${OUTPUT_PREFIX}-" && ! "$file" =~ "/\." ]]; then
        if should_exclude "$file"; then
            debug "Skipping excluded file: $file"
            return
        fi
        debug "Adding file: $file"
        echo "// $file" >> "$tempFile"
        echo "" >> "$tempFile"
        $CAT "$file" >> "$tempFile"
        echo "" >> "$tempFile"
        echo "" >> "$tempFile"
        ((fileCount++))
    fi
}

# Function to recursively process directories
process_directory() {
    local dir="$1"
    local header="$2"
    
    dir=$(resolve_path "$dir")
    debug "Processing directory: $dir"
    
    if [[ ! -d "$dir" ]]; then
        debug "Directory does not exist: $dir"
        return
    fi
    
    if should_exclude "$dir"; then
        debug "Skipping excluded directory: $dir"
        return
    fi
    
    if [[ -n "$header" ]]; then
        echo "$header" >> "$tempFile"
        echo "" >> "$tempFile"
    fi

    debug "Directory contents:"
    $LS -la "$dir" >&2 || debug "Could not list directory contents"

    debug "Searching for TypeScript files..."
    local files
    local find_cmd="$FIND \"$dir\" -type f \\( -name \"*.ts\" -o -name \"*.tsx\" \\)"
    
    # Add exclude patterns to find command
    for excluded in "${EXCLUDED_PATHS[@]}"; do
        find_cmd="$find_cmd -not -path \"*/$excluded/*\""
    done
    
    files=$(eval "$find_cmd 2>/dev/null")
    
    debug "Files found:"
    echo "$files" >&2
    
    if [[ -n "$files" ]]; then
        echo "$files" | while IFS= read -r file; do
            if [[ -n "$file" && -f "$file" ]]; then
                debug "Processing file: $file"
                process_file "$file"
            fi
        done
    else
        debug "No TypeScript files found in directory"
    fi
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
fi

# Check for required source directory argument
if [[ -z "${1:-}" ]]; then
    echo "Error: Please provide a directory path as an argument"
    usage
fi

# Get absolute path of source directory
filePath=$(resolve_path "$1")
shift

debug "Source directory: $filePath"

# Process arguments
OUTPUT_DIR="$DEFAULT_OUTPUT_DIR"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --exclude)
            shift
            while [[ $# -gt 0 && ! "$1" =~ ^- ]]; do
                EXCLUDED_PATHS+=("$1")
                shift
            done
            ;;
        *)
            if [[ ! -f "$1" && ! "$1" =~ ^- ]]; then
                OUTPUT_DIR=$(resolve_path "$1")
            fi
            shift
            ;;
    esac
done

debug "Output directory: $OUTPUT_DIR"
debug "Excluded paths: ${EXCLUDED_PATHS[*]}"

# Create output directory if it doesn't exist
if [[ ! -d "$OUTPUT_DIR" ]]; then
    debug "Creating output directory: $OUTPUT_DIR"
    $MKDIR -p "$OUTPUT_DIR"
fi

timestamp=$($DATE +"$TIMESTAMP_FORMAT")
outputFile="$OUTPUT_DIR/${OUTPUT_PREFIX}-$timestamp.md"
tempFile="/tmp/${OUTPUT_PREFIX}-temp-$timestamp.md"
fileCount=0

debug "Creating temporary file: $tempFile"
$TOUCH "$tempFile"

# Add custom text at the beginning of the file
echo "# Custom Requirements" >> "$tempFile"
for text in "${customTextList[@]}"; do
    echo "- $text" >> "$tempFile"
done
echo "" >> "$tempFile"

# Process external libraries
for path in "${externalLibs[@]}"; do
    if [[ -d "$path" ]]; then
        debug "Processing external directory: $path"
        process_directory "$path" "# Content from directory: $path"
    elif [[ -f "$path" ]]; then
        debug "Processing external file: $path"
        process_file "$path"
    else
        debug "Warning: Path '$path' not found"
    fi
done

# Process main directory
debug "Processing main directory: $filePath"
process_directory "$filePath" "# Content from main directory: $filePath"

if [[ ! -f "$tempFile" ]]; then
    echo "Error: Temporary file not created"
    exit 1
fi

fileSize=$($WC -c < "$tempFile")
sizeMB=$((fileSize / 1048576))

if [[ "$fileSize" -gt "$MAX_SIZE_BYTES" ]]; then
    echo "Error: Combined file size (${sizeMB}MB) exceeds limit of ${MAX_SIZE_MB}MB"
    $RM -f "$tempFile"
    exit 1
fi

$CP "$tempFile" "$outputFile"
$RM -f "$tempFile"

echo "Successfully created: $outputFile"
echo "Total size: ${sizeMB}MB"
echo "Number of files processed: $fileCount"