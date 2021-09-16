#!/usr/bin/env python

# Command Examples
# If there is a specific order you need the files executed in, use a csv string of paths
# python ./bin/reset_db.py -t --files ./database/ --path .env

import sys, getopt, os, re
from os import path, listdir
from os.path import join, dirname, abspath, isdir
import mysql.connector
import dotenv

files = []

env_message = lambda env_variable_name : "Error: " + env_variable_name + " not set"

help_menu = ("Exactly one environment must be specified\n\n" +
            "prod\t--prod/-p\tSelects the production environment\n" +
            "dev\t--dev/-d\tSelects the development environment\n" +
            "test\t--test/-t\tSelects the QA environment\n\n" +
            "path\t--path\t\tSets the .env file path [optional]\n" +
            "files\t--files/-f\tcomma seperated list of sql files, or directories to run, they will be run in order\n\n"
            "help\t--help/-h\tPrints this menu\n")

db = None
cursor = None
sql = []

DB_HOST = ""
DB_USER = ""
DB_PWD = ""
DB = ""

def parse_args():
    global files

    env = None
    path_loaded = False
    
    try:
        opts, args = getopt.getopt(sys.argv[1:], "dhf:pt", ["dev", "files=", "help", "path=", "prod", "test"])
    except:
        sys.exit(help_menu)

    for (opt, arg) in opts:
        if opt in ('-p', '--prod'):
            env = ""
        elif opt in ('-d', '--dev'):
            env = "_dev"
        elif opt in ('-t', '--test'):
            env = "_test"
        elif opt == "--path" and arg != "":
            dotenv.load_dotenv(arg)
            path_loaded = True
        elif opt in ('-f', '--files'):
            files = arg.split(",")
        else:
            sys.exit(help_menu)
            
    if env == None or len(files) == 0:
        sys.exit(help_menu)

    return env

def set_env(db_env):
    global DB_HOST
    global DB_USER 
    global DB_PWD
    global DB

    DB_HOST = os.getenv("DB_URL")
    if (DB_HOST == ""):
        sys.exit(env_message("DB_URL"))

    DB_USER = os.getenv("DB_USER")
    if (DB_USER == ""):
        sys.exit(env_message("DB_USER"))
            
    DB_PWD = os.getenv("DB_PWD")
    if (DB_PWD == ""):
        sys.exit(env_message("DB_PWD"))
            
    DB = os.getenv("DB")
    if (DB == ""):
        sys.exit(env_message("DB"))
    else:
        DB = DB + db_env

def read_file(file_path):
    with open(file_path) as file:
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
    global sql

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
    global sql
    # Split by ';'
    sql_regex = r".*?\;"

    matches = re.findall(sql_regex, data, flags=re.DOTALL+re.MULTILINE)

    for statement in matches:
        sql.append(statement)

def execute_sql(db, cursor): 
    global sql

    for statment in sql:
        try:
            cursor.execute(statment)
            db.commit()
        except:
            print()
            print(statment, "\n")
            cursor.close()
            db.close()
            sys.exit("SQL query failed" + "\n")

def go_through_files(file_list, prev_path=""):
    # Loop through array
    for file in file_list:
        # Get absolute path
        # If first time, cwd will work
        # Otherwise use the previous path
        if (prev_path == "" ):
            file_path = abspath(file)
        else:
            file_path = abspath(join(prev_path, file))

        if (isdir(file_path)):
            go_through_files(listdir(file_path), file_path)
        else:
            if ( file_path.endswith(".sql") ):
                execute_file(file_path)

def execute_file(file): 
    # Read into string
    data = read_file(file)
    data = format_file(data, DB)
    data = parse_delimited_sql(data)
    data = parse_sql(data)
    execute_sql(db, cursor)

def init_sql_conn(): 
    global db
    global cursor

    db = mysql.connector.connect(
        host = DB_HOST,
        user = DB_USER,
        password = DB_PWD
    )
    cursor = db.cursor()


def main():
    db_env = parse_args()
    set_env(db_env)
    init_sql_conn()
    go_through_files(files)


main()
