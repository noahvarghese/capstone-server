#!/usr/bin/env python

# Command Examples
# If there is a specific order you need the files executed in, use a csv string of paths
# python ./bin/reset_db.py -t --files ./database/ --path .env

# CI Examples
# - uses: actions/setup-python@v2
# - name: install python dependencies
#   run: python -m pip install --upgrade mysql-connector-python python-dotenv wheel
# - name: reset test DB
#   run: python bin/reset_db/reset_db.py -t --files ./database/

import sys
import getopt
import os
import re
from os import path, listdir, system, name
from os.path import join, dirname, abspath, isdir
import mysql.connector
import dotenv

files = []


def env_message(env_variable_name): return "Error: " + \
    env_variable_name + " not set"


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

if os.name == 'nt':
    import msvcrt
    import ctypes

    class _CursorInfo(ctypes.Structure):
        _fields_ = [("size", ctypes.c_int),
                    ("visible", ctypes.c_byte)]


def hide_cursor():
    if os.name == 'nt':
        ci = _CursorInfo()
        handle = ctypes.windll.kernel32.GetStdHandle(-11)
        ctypes.windll.kernel32.GetConsoleCursorInfo(handle, ctypes.byref(ci))
        ci.visible = False
        ctypes.windll.kernel32.SetConsoleCursorInfo(handle, ctypes.byref(ci))
    elif os.name == 'posix':
        sys.stdout.write("\033[?25l")
        sys.stdout.flush()


def show_cursor():
    if os.name == 'nt':
        ci = _CursorInfo()
        handle = ctypes.windll.kernel32.GetStdHandle(-11)
        ctypes.windll.kernel32.GetConsoleCursorInfo(handle, ctypes.byref(ci))
        ci.visible = True
        ctypes.windll.kernel32.SetConsoleCursorInfo(handle, ctypes.byref(ci))
    elif os.name == 'posix':
        sys.stdout.write("\033[?25h")
        sys.stdout.flush()


def parse_args():
    global files

    env = None
    path_loaded = False

    try:
        opts, args = getopt.getopt(sys.argv[1:], "dhf:pt", [
                                   "dev", "files=", "help", "path=", "prod", "test"])
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
    delimiter_items = re.findall(
        delimiter_changed_regex, data, flags=re.DOTALL+re.MULTILINE)
    data = re.sub(delimiter_changed_regex, '', data)

    # get indexes of '//'
    for item in delimiter_items:
        prev_index = 0

        # Seperate based off of index
        while prev_index < len(item) - 1:
            index = item.find("//", prev_index)

            if (index == -1):
                next_index = len(item)
            else:
                next_index = index + 2

            command = item[prev_index:next_index]
            command = command.replace("//", '')

            if ("DELIMITER" not in command):
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


# Print iterations progress
def printProgressBar(iteration, total, prefix='', suffix='', decimals=1, length=100, fill='█', printEnd="\r"):
    """
    Call in a loop to create terminal progress bar
    @params:
        iteration   - Required  : current iteration (Int)
        total       - Required  : total iterations (Int)
        prefix      - Optional  : prefix string (Str)
        suffix      - Optional  : suffix string (Str)
        decimals    - Optional  : positive number of decimals in percent complete (Int)
        length      - Optional  : character length of bar (Int)
        fill        - Optional  : bar fill character (Str)
        printEnd    - Optional  : end character (e.g. "\r", "\r\n") (Str)
    """
    percent = ("{0:." + str(decimals) + "f}").format(100 *
                                                     (iteration / float(total)))
    filledLength = int(length * iteration // total)
    bar = fill * filledLength + '-' * (length - filledLength)
    print(f'\r{prefix} |{bar}| {percent}% {suffix}', end=printEnd)
    # Print New Line on Complete
    if iteration == total:
        print()


def execute_sql(db, cursor):
    global sql

    for i, statment in enumerate(sql):
        printProgressBar(i + 1, len(sql), prefix='Progress:',
                         suffix='Complete', length=50)
        try:
            cursor.execute(statment)
            db.commit()
        except Exception as e:
            print()
            print(str(e))
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
        if (prev_path == ""):
            file_path = abspath(file)
        else:
            file_path = abspath(join(prev_path, file))

        if (isdir(file_path)):
            list_dir = listdir(file_path)
            list_dir = sorted(list_dir)

            go_through_files(list_dir, file_path)
        else:
            if (file_path.endswith(".sql")):
                execute_file(file_path)
    clear()


def execute_file(file):
    # Read into string
    clear()
    print("File: " + file)
    print("Reading file...")
    data = read_file(file)
    data = format_file(data, DB)
    data = parse_delimited_sql(data)
    data = parse_sql(data)
    print("Executing file...")
    execute_sql(db, cursor)


def init_sql_conn():
    global db
    global cursor

    db = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PWD
    )
    cursor = db.cursor()


def clear():
    # for windows
    if name == 'nt':
        _ = system('cls')
    # for mac and linux(here, os.name is 'posix')
    else:
        _ = system('clear')


def main():
    hide_cursor()
    db_env = parse_args()
    set_env(db_env)
    init_sql_conn()
    go_through_files(files)
    show_cursor()


main()
