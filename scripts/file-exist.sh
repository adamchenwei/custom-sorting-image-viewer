#!/bin/bash

# Check if an argument was provided
if [ $# -eq 0 ]; then
    echo "Error: No file path provided"
    echo "Usage: $0 /path/to/your/file"
    exit 1
fi

# Store the file path from the first argument
file_path="$1"

# Check if the file exists
if [ -f "$file_path" ]; then
    echo "File exists: $file_path"
    exit 0
else
    echo "File does not exist: $file_path"
    exit 1
fi