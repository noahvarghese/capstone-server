#!/bin/bash

exec_sql() {
    readarray -d '' entries < <(printf '%s\0' database/*.sql | sort -zV)
    for entry in "${entries[@]}"; do
        echo "mysql -u $DB_USER -h $DB_URL -p$DB_PWD < $entry"
        mysql -u $DB_USER -h $DB_URL -p$DB_PWD < $entry
        if [ $? -gt 0 ]; then
            break
        fi
    done
}

# setup environment locally as CI and prod should have all variables already loaded
if [[ $NODE_ENV == 'dev' ]]; then

    source ./bin/env.sh

    if ! envup; then
        exit 1
    fi
fi

exec_sql