#!/usr/bin/env python

import sys, getopt, os, re
from os.path import join, dirname, abspath
# mysql-connector-python
import mysql.connector
# python-dotenv
import dotenv

dotenv_path = abspath(join(dirname(__file__) + "../../../.env"))
dotenv.load_dotenv(dotenv_path)

files = ["schema.sql", "triggers.sql"]

help_menu = ("Exactly one argument must be specified\n\n" +
            "prod\t--prod/-p\tSelects the production environment\n" +
            "dev\t--dev/-d\tSelects the development environment\n" +
            "test\t--test/-t\tSelects the QA environment\n" +
            "help\t--help/-h\tPrints this menu\n")

def main():
    # get env to use from cli args
    env = ""

    try:
        opts, _ = getopt.getopt(sys.argv[1:], "dpt")
    except:
        print(help_menu)
        sys.exit()

    # throw error if more than one are set
    if ( len(opts) != 1 ):
        print(help_menu)
        sys.exit()


    for (opt, arg) in opts:
        # (--test/-t, --dev/-d, --prod/-p)
        if opt in ('-p', '--prod'):
            env = ""
        elif opt in ('-d', '--dev'):
            env = "_dev"
        elif opt in ('-t', '--test'):
            env = "_test"
        else:
            print(help_menu)
            sys.exit()

    db = mysql.connector.connect(
        host = os.getenv("DB_URL"),
        user = os.getenv("DB_USER"),
        password = os.getenv("DB_PWD")
    )

    dbname = os.getenv("DB") + env
    print(dbname)

    cursor = db.cursor()

    sql = []

    for file in files:
        # Open schema.sql
        # Read into string
        # remove newlines
        path = abspath(os.path.join(__file__, "../..", file))

        with open(path) as file:
            data = file.read().replace('\n', ' ')

        # Replace all occurences of '${DATABASE}' with dbname + env
        data = data.replace("${DATABASE}", dbname)

        # Remove these from the string
        comment_regex = r"/\/*.*?\*\/"
        data = re.sub(comment_regex, '', data)

        # Keep these for secondary parsing
        delimiter_changed_regex = r"DELIMITER\s\/\/.*?DELIMITER\s\;"

        # Get and then remove the matches
        delimiter_items = re.findall(delimiter_changed_regex, data, flags=re.DOTALL+re.MULTILINE)
        data = re.sub(delimiter_changed_regex, '', data)

        # get indexes of '//'
        for item in delimiter_items:
            prev_index = 0

            # Seperate based off of index
            while prev_index < len(item) - 1:
                index = item.find("//", prev_index)

                if ( index == -1 ):
                    next_index = len(item)
                else:
                    next_index = index + 2

                command = item[prev_index:next_index]
                command = command.replace("//", '')
                
                if ( "DELIMITER" not in command):
                    sql.append(command)

                print(command)
                
                prev_index = next_index + 1


        # Split by ';'
        sql_regex = r".*?\;"

        matches = re.findall(sql_regex, data, flags=re.DOTALL+re.MULTILINE)

        for statement in matches:
            sql.append(statement)

        for statment in sql:
            try:
                cursor.execute(statment)
                db.commit()
            except:
                print("SQL query failed")
                print(statment, "\n")
                sys.exit()

main()