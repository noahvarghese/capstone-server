#!/bin/bash
FROMATTED_ROUTES=()

for f in $(find src/routes/member -name '*.ts');
do
    echo "$f"
    routes=( $(cat "$f" | grep "router.use(\"") )
    echo "RS"
    echo $routes

    for r in "${routes[@]}";
    do
        echo "N"
        echo "$r"
        prefix_removed=${r:12}
        echo "P"
        echo "$prefix_removed"
        route=$(echo "$prefix_removed" | cut -d \" -f 1)
        echo "R"
        echo "$route"
        FORMATTED_ROUTES+="$route"
    done
done

for r in "${FORMATTED_ROUTES[@]}"; do
    if [ ! $(cat ./README.md | grep -q "$r") ]; then
        echo Route "$r" missing from documentation
        exit 125
    fi
done