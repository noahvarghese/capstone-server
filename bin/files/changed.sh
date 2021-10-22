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
    exit $1
} 

trim_all_whitespace() {
    echo -e "${1}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

if [[ -z $1 ]]; then
    echo "Variable files not set"
    exit 1
fi

DELIMITER=,

if [ ! -z $2 ]; then
    DELIMITER=$2
fi

GIVEN_FILES=$1
CHANGED_FILES=$(git diff --name-only $(git rev-parse @~) $(git rev-parse @))

echo "$CHANGED_FILES"

for changed in ${CHANGED_FILES[@]}; do
    IFS=$DELIMITER
    for given in ${GIVEN_FILES[@]}; do
        given="$(trim_all_whitespace "$given")"
        if [[ "$changed" == *"$given"* ]]; then
            echo [ CHANGED ]: "$changed"
            echo [ PATTERN ]: "$given"
            cleanup 2
        fi
    done
done

echo "No files matched"
cleanup 0