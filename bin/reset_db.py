#!/usr/bin/env python

import sys, getopt, os, re
from os.path import join, dirname, abspath
# mysql-connector-python
import mysql.connector
# python-dotenv
import dotenv

dotenv_path = abspath(join(dirname(__file__), "../.env"))
dotenv.load_dotenv(dotenv_path)

files = ["schema.sql", "triggers.sql"]

help_menu = ("Exactly one argument must be specified\n\n" +
            "prod\t--prod/-p\tSelects the production environment\n" +
            "dev\t--dev/-d\tSelects the development environment\n" +
            "test\t--test/-t\tSelects the QA environment\n" +
            "help\t--help/-h\tPrints this menu\n")

sql = []

def get_env():
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
    
    return env

def read_file(file_name):
    path = abspath(os.path.join(dirname(__file__), "../database/", file_name))

    with open(path) as file:
        data = file.read()
        
    return data

def format_file(data, dbname):
    data = data.replace("${DATABASE}", dbname)
    data = data.replace("\n", " ")

    # Remove comments from the string
    comment_regex = r"/\/*.*?\*\/"
    data = re.sub(comment_regex, '', data)

    return data

def parse_delimited_sql(data):
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

            prev_index = next_index + 1
    
    return data

def parse_sql(data): 
    # Split by ';'
    sql_regex = r".*?\;"

    matches = re.findall(sql_regex, data, flags=re.DOTALL+re.MULTILINE)

    for statement in matches:
        sql.append(statement)

def execute_sql(db, cursor): 
    for statment in sql:
        try:
            cursor.execute(statment)
            db.commit()
        except:
            print("SQL query failed")
            print(statment, "\n")
            sys.exit()

def main():
    # get env to use from cli args

    env = get_env()

    db = mysql.connector.connect(
        host = os.getenv("DB_URL"),
        user = os.getenv("DB_USER"),
        password = os.getenv("DB_PWD")
    )

    dbname = os.getenv("DB") + env

    cursor = db.cursor()

    for file in files:
        # Open schema.sql
        # Read into string
        data = read_file(file)

        # remove newlines
        # Replace all occurences of '${DATABASE}' with dbname + env
        data = format_file(data, dbname)

        data = parse_delimited_sql(data)

        data = parse_sql(data)

        execute_sql(db, cursor)

        


main()