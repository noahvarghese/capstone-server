#!/bin/bash

source ./bin/database/lib/sql.sh
source ./bin/env.sh

read -r -d '' HELP<<EOF
    \n[ HELP ]: Checks database tables are empty using environment variables\n
    \t--tables\t\tFollowing this flag there should be a comma seperated list of tables e.g. table1,table2,table3\n
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
    exit 1
}

is_empty() {
    extension=$1
    tables=$2

    db="${DB_NAME}${extension}"

    echo "[ EVENT ]: Checking database $db"

    prev_ifs=$IFS
    IFS=','

    for table in $tables; do
        exec_is_empty $db $table
        res=$?

        if [[ $res -gt 0 ]]; then
            echo "[ ERROR ]: $db.$table has $res record(s)" 1>&2
            exit $res
        fi
    done

    IFS=$prev_ifs
}

tables=
db_env=
env=

temp=$(getopt -o 'dpt::' --long 'tables:' -n 'is_empty.sh' -- "$@")

if [ $? -ne 0 ]; then
	echo 'Terminating...' >&2
	exit 1
fi

eval set -- "$temp"
unset temp 

while true; do
    case "$1" in
        '-t')  
            case "$2" in
                '')
                    db_env="_test"
                ;;
                *)
                    db_env="_test_$2"
                ;;
            esac
            shift 2
            continue
        ;;
        '-d')  
            db_env="_dev" 
            shift
            continue
        ;;
        '-p')  
            shift
            continue
        ;;
        '--tables')
            tables="$2"
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
    if ! envup $env; then
        exit 1
    fi
else
    echo "[ INFO ]: Operating within Prod or CI environment, variables will not be loaded, run 'export NODE_ENV=dev' to enable --env-path"
fi

is_empty "$db_env" "$tables"