#!/bin/bash

source ./bin/database/lib/sql.sh
source ./bin/env.sh

read -r -d '' HELP<<EOF
    [ HELP ]: This script resets a database given a series of environment variables, SQL files, and name extensions\n
    [--env-path]\toptional path to a file that has the environment variables, this is only used if the NODE_ENV variable is set to 'dev'\n
    Requires one of the next three (3) options\n
    \t-t[=]\tappends '_test' to the database name, if a value is provided (must be no spaces between flag and value) it is appended as '_test_value'\n
    \t-d\tappends '_dev' to the database name\n
    \t-p\tdoes not append anything to the database name\n
    Environment variables:\n
    \tDB_NAME\tthe name of the database\n
    \tDB_USER\tthe user to be logged in as\n
    \tDB_PWD\tthe password to login with\n
    \tDB_URL\tthe hostname/FQDN/IP address of the database
EOF

help() {
    echo -e $HELP 1>&2
    exit $1
}

drop_db() {
    EXTENSION=$1

    DB="${DB_NAME}${EXTENSION}"

    echo "[ EVENT ]: Dropping database $DB"

    exec_drop $DB
}

DB_ENV=""
ENV=""

TEMP=$(getopt -o 'dpt::' --long 'env-path:' -n 'drop.sh' -- "$@")

if [ $? -ne 0 ]; then
	echo 'Terminating...' >&2
	exit 1
fi

eval set -- "$TEMP"
unset TEMP

while true; do
    case "$1" in
        '-t')  
            case "$2" in
                '')
                    DB_ENV="_test"
                ;;
                *)
                    DB_ENV="_test_$2"
                ;;
            esac
            shift 2
            continue
        ;;
        '-d')  
            DB_ENV="_dev" 
            shift
            continue
        ;;
        '-p')  
            shift
            continue
        ;;
        '--env-path')
            ENV="$2"
            shift 2
            continue
        ;;
        '-h'|'--help') 
            help 0 
        ;;
        '--')
            shift
            break
        ;;
        *) 
            help 1
        ;;
    esac
done 


# setup environment locally as CI and prod should have all variables already loaded
if [[ $NODE_ENV == 'dev' ]]; then
    if ! envup $ENV; then
        exit 1
    fi
else
    echo "[ INFO ]: Operating within Prod or CI environment, variables will not be loaded, run `export NODE_ENV=dev` to enable --env-path"
fi

drop_db "$DB_ENV"