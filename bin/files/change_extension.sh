#!/bin/bash

read -r -d '' HELP<<EOF
    [ HELP ]: Search directory for all files that match glob, replace matching string with new string\n
    \t-d/--dir\tthe directory to search in\n
    \t-n/--new\tthe pattern to change to\n
    \t-o/--old\tthe pattern to change\n
    \t-s/--search\tthe search pattern
EOF

dir=
new=
old=
search=

help() {
    echo -e $HELP 1>&2
    exit $1
}

parse_args() {
    if [[ $# -lt 4 ]]; then
        help 1
    fi

    temp=$(getopt -o 'dhn:o:s:' --long 'dir:,help,new:,old:,search:' -n 'change_extension.sh' -- "$@")

    if [ $? -ne 0 ]; then
    	echo 'Terminating...' >&2
    	exit 1
    fi

    eval set -- "$temp"
    unset temp 

    while true; do
        case "$1" in
            '-d'|'--dir')
                dir="$2"
                shift 2
                continue
            ;;
            '-n'|'--new')
                new="$2"
                shift 2
                continue
            ;;
            '-o'|'--old')
                old="$2"
                shift 2
                continue
            ;;
            '-s'|'--search')
                search="$2"
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
}

main() {
    parse_args "$@"

    command -v shopt &>/dev/null
    shopt -s globstar
    readarray -d '' arr < <(printf '%s\0' "${dir}"**/"${search}" | sort -zV)

    prev_ifs=$IFS
    IFS=' '

    for f in ${arr[@]}; do
        new_name="${f%"${old}"}${new}"
        echo -e "[ LOG ]: Moving $f\t->\t$new_name"
        mv -- "$f" "$new_name"
    done

    IFS=$prev_ifs
}


main "$@"