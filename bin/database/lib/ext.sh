#!/bin/bash

read -r -d '' EXT_HELP<<EOF
    \nRequires one ofthe following three (3) options\n
    \t-t\t\tSelects the 'test' environment, if there is a string after, it will be added to the database name\n
    \t-d\t\tSelects the'dev' environment\n
    \t-p\t\tSelects the 'prod' environment, leaves the db name without an extension e.g. dbname instead of dbname_extension\n
EOF

db_ext_help() {
    echo -e $EXT_HELP 1>&2
    exit 1
}

get_db_ext() {
    EXTENSION=""

    if [[ $# -eq 0 ]]; then
        echo -e $HELP 1>&2
        exit 1
    fi

    for ((i=1;i<=$#;i++)); do
        case ${!i} in
            "-d")
                EXTENSION="_dev"
                ;;
            "-t")
                i=$((i+1))
                test_ext=${!i}

                if [[ -z $test_ext ]]; then
                    EXTENSION="_test"
                else
                    EXTENSION="_test_${!i}"  
                fi
                ;;
            "-h")
                db_ext_help
                ;;
            "--help")
                db_ext_help
                ;;
            *)
                db_ext_help
                ;;
        esac
    done

    echo $EXTENSION
}