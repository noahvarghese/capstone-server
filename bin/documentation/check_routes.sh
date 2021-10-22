#!/bin/bash

if ! test -f "$1"; then
    echo "Please provide a valid file"
    exit 125
fi

SAVEIFS=$IFS   # Save current IFS
IFS=$'\n'      # Change IFS to new line
names=($names) # split to array $names
FOUND=0

for f in $(find src/routes -name '*.ts');
do
    routes=( $(cat "$f" | grep "router.use(\"") )

    for r in "${routes[@]}";
    do
        prefix_removed=${r:12}
        route=$(echo "$prefix_removed" | cut -d \" -f 1)
    
        cat $1 | grep -q "$route"
        if [ $(echo $?) -gt 0 ]; then
            echo Route: "$route" missing from documentation
            FOUND+=1
        fi
    done
done

if [ $FOUND -gt 0 ]; then
    exit 125
fi

IFS=$SAVEIFS   # Restore IFS