#!/bin/bash

BRANCH_NAME=$(git branch --show-current)
BRANCH_NAME=$(echo $BRANCH_NAME | sed -r 's/[-.:]/_/g')

# Database name extension
EXTENSION="$BRANCH_NAME"_$(date +%s)

# Enable ** glob for coverage report
command -v shopt &>/dev/null
shopt -s globstar

NODE_ENV=test

# Setup database
npm run database:reset:test -- $EXTENSION

# Custom test reporting
./node_modules/.bin/nyc --silent --no-clean ./node_modules/.bin/jest --runInBand "$@" ;

TEST_RESULT=$?

if [ $TEST_RESULT -gt 0 ]; then
    # If the database is empty then drop the database
    npm run database:is_empty:test -- $EXTENSION --tables business,user

    if [ $? -eq 0 ]; then
        npm run database:drop:test $EXTENSION
    fi

    exit 1
else
    # If the tests passed then the database should be empty
    npm run database:drop $DB_ENV
fi