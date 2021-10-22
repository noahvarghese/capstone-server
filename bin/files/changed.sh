#!/bin/bash
SAVEIFS=$IFS   # Save current IFS

trim_all_whitespace() {
    echo -e "${1}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

if [[ -z $1 ]]; then
    echo "Changed files not set"
    exit 1
fi

if [[ -z $2 ]]; then
    echo "Variable files not set"
    exit 1
fi

DELIMITER=,

if [ ! -z $3 ]; then
    DELIMITER=$3
fi

IFS=$DELIMITER

CHANGED_FILES=$1
GIVEN_FILES=$2

for changed in ${CHANGED_FILES[@]}; do
    for given in ${GIVEN_FILES[@]}; do
        given="$(trim_all_whitespace "$given")"
        if [[ "$changed" == *"$given"* ]]; then
            IFS=$SAVEIFS   # Restore IFS
            echo true
            exit
        fi
    done
done

# echo "No files matched"
IFS=$SAVEIFS   # Restore IFS
echo false
exit