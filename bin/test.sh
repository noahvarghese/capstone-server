#!/bin/bash

branch_name=$(git branch --show-current)
branch_name=$(echo $branch_name | sed -r 's/[-.:]/_/g')

# Database name extension
extension="$branch_name"_$(date +%s)

# Enable ** glob for coverage report
command -v shopt &>/dev/null
shopt -s globstar

NODE_ENV=test

# Setup database
npm run database:reset -- "-t$extension"

# Custom test reporting
./node_modules/.bin/nyc --silent --no-clean ./node_modules/.bin/jest --runInBand "$@" ;

test_result=$?

if [ $test_result -gt 0 ]; then
    # If the database is empty then drop the database
    npm run database:is_empty -- "-t$extension"

    if [ $? -eq 0 ]; then
        npm run database:drop -- "-t$extension"
    fi

    exit 1
else
    # If the tests passed then the database should be empty
    # We still check to make sure we cleaned up
    # If the database is empty then drop the database
    npm run database:is_empty -- "-t$extension"

    if [ $? -eq 0 ]; then
        npm run database:drop -- "-t$extension"
        exit 0
    else
        echo "[ ERROR ]: Database not empty, perhaps you forgot to cleanup after?" 1>&2
        exit 1
    fi
fi