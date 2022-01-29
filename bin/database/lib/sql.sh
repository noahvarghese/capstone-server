#!/bin/bash

SQL_INIT_FILE="/tmp/init.sql"
SQL_DROP_FILE="/tmp/drop.sql"

exec_sql() {
    if [[ $# -eq 1 ]]; then 
        echo "[ CMD ]: mysql -u $DB_USER -h $DB_URL -p$DB_PWD < $1"
        mysql -u $DB_USER -h $DB_URL -p$DB_PWD < $1
    elif [[ $# -eq 2 ]]; then
        echo "[ CMD ]: mysql --database $1 -u $DB_USER -h $DB_URL -p$DB_PWD < $2"
        mysql --database $1 -u $DB_USER -h $DB_URL -p$DB_PWD < $2
    else
        echo "[ ERROR ]: must either pass a SQL file to execute OR a database name AND a SQL file" 1>&2
        exit 1
    fi
}

gen_reset_script() {
    echo "[ EVENT ]: Creating file $SQL_INIT_FILE for database $1"

    cat <<EOF > $SQL_INIT_FILE
    DROP DATABASE IF EXISTS $1;
    CREATE DATABASE $1;
    USE $1;
EOF
}

gen_drop_script() {
    echo "[ EVENT ]: Creating file $SQL_DROP_FILE for database $1"

    cat <<EOF > $SQL_DROP_FILE
    DROP DATABASE IF EXISTS $1;
EOF
}