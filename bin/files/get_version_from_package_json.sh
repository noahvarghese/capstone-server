#!/bin/bash

# Gets Whole Version Number
VERSION=$(cat ./package.json | grep \"version\" | cut -d : -f 2 | sed 's/\",$//g' | sed 's/\"//g') 
# Gets last digit of version number
TRAILING_VERSION=$(echo $VERSION | cut -d . -f 3)
VERSION=$(echo $VERSION | cut -d . -f 1).$(echo $VERSION | cut -d . -f 2).$TRAILING_VERSION

echo $VERSION

