#!/bin/bash

envup() {
  # If no file provided use .env else use file name
  local file=$([ -z "$1" ] && echo ".env" || echo "$1")
  # Check if file provided is actually a file, otherwise use .env.$file
  file=$([ -f "$file" ] && echo "$file" || echo ".env.$file")

  # Check again if file is a file
  if [ -f $file ]; then
    echo "[ EVENT ]: Loading environment variables from $file"
    set -a
    source $file
    set +a
  else
    echo "[ ERROR ]: No file -> $1, or $file found" 1>&2
    return 1
  fi
}

# envup "$@"
# Run as source ./bin/env