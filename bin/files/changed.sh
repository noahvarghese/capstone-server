#!/bin/bash

# Get git diff files
# Loop over changed files
# Loop over files to watch
# If match
# Return true And Exit
# In our case we are going to throw an error, or an exit code of greater than zero
SAVEIFS=$IFS   # Save current IFS

cleanup() {
    IFS=$SAVEIFS   # Restore IFS
    echo $1
} 

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

# echo $?
# echo "$CHANGED_FILES"

for changed in ${CHANGED_FILES[@]}; do
    for given in ${GIVEN_FILES[@]}; do
        given="$(trim_all_whitespace "$given")"
        if [[ "$changed" == *"$given"* ]]; then
            # echo [ CHANGED ]: "$changed"
            # echo [ PATTERN ]: "$given"
            cleanup true
        fi
    done
done

# echo "No files matched"
cleanup false