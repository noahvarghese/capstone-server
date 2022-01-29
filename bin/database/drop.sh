#!/bin/bash

source ./bin/database/lib/ext.sh
source ./bin/database/lib/sql.sh
source ./bin/env.sh

drop_db() {
    EXTENSION=$1
    DB="${DB_NAME}${EXTENSION}"

    echo "[ EVENT ]: Dropping database $DB"

    gen_drop_script $DB
    exec_sql $SQL_DROP_FILE
    rm $SQL_DROP_FILE
}

# setup environment locally as CI and prod should have all variables already loaded
if [[ $NODE_ENV == 'dev' ]]; then
    if ! envup $(env_path "$@"); then
        exit 1
    fi
fi

if [[ -z $1 ]]; then
    echo "[ ERROR ]: Must provide a database extension" 1>&2
    exit 1
fi


drop_db "$(get_db_ext "$@")"