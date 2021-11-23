#!/bin/bash

BRANCH_NAME=$(git branch --show-current)
BRANCH_NAME=$(echo $BRANCH_NAME | sed -r 's/[-.:]/_/g')
# Get name
export DB_ENV=test_"$BRANCH_NAME"_$(date +%s)
DB_NAME="${DB}${DB_ENV}"

echo "[ Event ]: Initting ${DB_NAME}"

# Setup database
npm run database:reset:ci -- $DB_ENV

# Enable ** glob for coverage report
command -v shopt &>/dev/null
shopt -s globstar

NODE_ENV=test

./node_modules/.bin/jest --runInBand "$@" ;

TEST_RESULT=$?

if [ $TEST_RESULT -gt 0 ]; then
    # If the database is empty then drop the database
    npm run database:is_empty -- $DB_ENV --tables business,user

    if [ $? -eq 0 ]; then
        npm run database:drop $DB_ENV
    fi
    exit 1
else
    npm run database:drop $DB_ENV
fi