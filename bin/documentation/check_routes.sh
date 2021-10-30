#!/bin/bash

SAVEIFS=$IFS   # Save current IFS
IFS=$'\n'      # Change IFS to new line

cleanup() {
    IFS=$SAVEIFS   # Restore IFS
    exit $1
}

if ! test -f "$1"; then
    echo "Please provide a valid file"
    cleanup 1
fi
echo $1 $2

if ! test -d "$2"; then
    echo "Please provide a path to the routes"
    cleanup 2
fi


FOUND=0

for f in $(find "$2" -name '*.ts');
do
    routes=( $(cat "$f" | grep "router.use(\"") )

    for r in "${routes[@]}";
    do
        prefix_removed=${r:12}
        route=$(echo "$prefix_removed" | cut -d \" -f 1)
        
        # Formats the file and route to make sense in context
        # Removes the file prefix that was passed as part of the CLI args
        file_path="${f:${#2}-1}"
        # Removes the index.ts to allow for concatenation
        file_path="${file_path%/index.ts}"

        full_route="$file_path""$route"
    
        # Checks that the file contains the route
        cat $1 | grep -q "$full_route"

        if [ $(echo $?) -gt 0 ]; then
            echo Route: "$full_route" missing from documentation file "$1"
            FOUND+=1
        fi
    done
done

if [ $FOUND -gt 0 ]; then
    cleanup 3
fi

cleanup 0