#!/bin/bash

NUM_ARGS=$#
ALL_ARGS=$@
DEFAULT_ENV_PATH=.env
VARS=''

get_vars() {
    VARS=$(sudo cat $1 | sed 's/#.*//g' | xargs)
}

echo "Must be run with the prefix 'source' or '.' (ex 'source ./bin/load_dotenv.sh')"

if [[ $NUM_ARGS -gt 0 ]]
then
    for file_path in $ALL_ARGS
    do
        if [[ -f $file_path ]]
        then
            get_vars $file_path
            echo $VARS
            export $VARS
        fi
    done
else
    if [[ -f .env ]]
    then
        get_vars $DEFAULT_ENV_PATH
        echo $VARS
        export $VARS
    fi
fi