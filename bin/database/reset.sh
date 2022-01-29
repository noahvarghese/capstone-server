#!/bin/bash

source ./bin/database/lib/ext.sh
source ./bin/database/lib/sql.sh
source ./bin/env.sh

reset_db() {
    EXTENSION=$1

    DB="${DB_NAME}${EXTENSION}"

    gen_reset_script $DB
    exec_sql $SQL_INIT_FILE
    rm $SQL_INIT_FILE

    readarray -d '' entries < <(printf '%s\0' database/*.sql | sort -zV)

    for entry in "${entries[@]}"; do
        exec_sql $DB "${entry}"
        if [ $? -gt 0 ]; then
            break
        fi
    done
}

# setup environment locally as CI and prod should have all variables already loaded
if [[ $NODE_ENV == 'dev' ]]; then
    if ! envup $(env_path "$@"); then
        exit 1
    fi
fi

if [[ -z $1 ]]; then
    echo "Must provide a database name" 1>&2
    exit 1
fi

reset_db $(get_db_ext "$@")