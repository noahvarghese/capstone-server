#!/bin/bash

read -r -d '' ENV_PATH_HELP<<EOF
  \nNo file found to load environment variables .env, .env.$1, $1
EOF

env_path_help() {
    echo -e $ENV_PATH_HELP 1>&2
    exit 1
}

env_path() {
    PATH=""
    for ((i=1;i<=$#;i++)); do
      case ${!i} in
        "-p")
          i=$((i+1))
          PATH=${!i}  
          echo $PATH
          ;;
        "--path")
          i=$((i+1))
          PATH=${!i}  
          ;;
      esac
    done
    echo $PATH
}

envup() {
  local file=$([ -z "$1" ] && echo ".env" || echo ".env.$1")

  if [ -f $file ]; then
    echo "Loading environment variables from $file"
    set -a
    source $file
    set +a
  else
    echo "No $file file found" 1>&2
    echo "$(env_path_help $file)" 1>&2
    return 1
  fi
}

# envup "$@"
# Run as source ./bin/env