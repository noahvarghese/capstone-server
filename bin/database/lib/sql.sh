#!/bin/bash

SQL_INIT_FILE="/tmp/init.sql"
SQL_DROP_FILE="/tmp/drop.sql"
SQL_IS_EMPTY_FILE="/tmp/is_empty.sql"

RES_FILE="/tmp/res.txt"

exec_sql() {
    if [[ -n "$1" ]] && [[ -f "$2" ]]; then
        echo "[ CMD ]: mysql ${@:3} --database $1 -u $DB_USER -h $DB_URL -p$DB_PWD < $2"
        mysql ${@:3} --database $1 -u $DB_USER -h $DB_URL -p$DB_PWD < $2 > $RES_FILE
    elif [[ -f "$1" ]]; then 
        echo "[ CMD ]: mysql ${@:2} -u $DB_USER -h $DB_URL -p$DB_PWD < $1"
        mysql ${@:2} -u $DB_USER -h $DB_URL -p$DB_PWD < $1 > $RES_FILE
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

exec_reset() {
    if [[ $# -ne 1 ]] || [[ -z "$1" ]]; then
        echo "[ ERROR ]: Reset database requires a database name" 1>&2
        exit 1
    fi

    gen_reset_script $1
    exec_sql $SQL_INIT_FILE
    rm $SQL_INIT_FILE
}

gen_drop_script() {
    echo "[ EVENT ]: Creating file $SQL_DROP_FILE for database $1"

    cat <<EOF > $SQL_DROP_FILE
    DROP DATABASE IF EXISTS $1;
EOF
}

exec_drop() {
    if [[ $# -ne 1 ]] || [[ -z "$1" ]]; then
        echo "[ ERROR ]: Reset database requires a database name" 1>&2
        exit 1
    fi

    gen_drop_script $1
    exec_sql $SQL_DROP_FILE
    rm $SQL_DROP_FILE
}

gen_is_empty_script() {
    if [[ -z "$1" ]] || [[ -z "$2" ]]; then
        echo "[ ERROR ]: must pass a database name and table name to check" 1>&2
        exit 1
    fi

    db=$1
    table=$2

    echo "[ EVENT ]: Creating file $SQL_IS_EMPTY_FILE for $db.$table"

    echo -e "USE $db;\nSELECT COUNT(*) AS c FROM $table;" > $SQL_IS_EMPTY_FILE
}

exec_is_empty() {
    if [[ -z "$1" ]] || [[ -z "$2" ]]; then
        echo "[ ERROR ]: must pass a database name and table name to check" 1>&2
        exit 1
    fi

    gen_is_empty_script "$@"
    # Pass the flags to display the sql results without a header or grid ('-sN')
    exec_sql $SQL_IS_EMPTY_FILE -sN
    
    rm $SQL_IS_EMPTY_FILE

    res=`cat $RES_FILE`
    rm $RES_FILE
    
    return $res
}