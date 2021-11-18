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

import dotenv
import getopt
import sys
import os
import re
from typing import List
from lib import screen, file, sql
from lib.screen import hide_cursor, show_cursor
from lib.file import iterate_over_files, read

help_menu = ("Exactly one environment must be specified\n\n" +
             "prod\t--prod/-p\tSelects the production environment\n" +
             "dev\t--dev/-d\tSelects the development environment\n" +
             "test\t--test/-t\tSelects the QA environment\n\n" +
             "path\t--path\t\tSets the .env file path [optional]\n" +
             "files\t--files/-f\tcomma seperated list of sql files, or directories to run, they will be run in order\n\n"
             "help\t--help/-h\tPrints this menu\n")


def parse_args() -> List[str]:
    try:
        opts, args = getopt.getopt(sys.argv[1:], "dhf:pt", [
                                   "dev", "files=", "help", "path=", "prod", "test", "ci="])
    except:
        sys.exit(help_menu)

    env = None
    files = []

    for (opt, arg) in opts:
        if opt in ('-p', '--prod'):
            env = ""
        elif opt in ('-d', '--dev'):
            env = "_dev"
        elif opt in ('-t', '--test'):
            env = "_test"
        elif opt == '--ci':
            env = arg
        elif opt == "--path" and arg != "":
            dotenv.load_dotenv(arg)
        elif opt in ('-f', '--files'):
            files = arg.split(",")
        else:
            sys.exit(help_menu)

    if env == None or len(files) == 0:
        sys.exit(help_menu)
    else:
        db_name = os.getenv("DB")

        if not (env is None):
            if len(env) > 0:
                db_name += f'{("_","")[env[0] == "_"]}'
            db_name += env

        os.environ["DB_NAME"] = db_name

    return files


def main():

    def format_file(data):
        data = data.replace("${DATABASE}", os.getenv("DB_NAME"))
        data = data.replace("\n", " ")

        # Remove comments from the string
        comment_regex = r"/\/*.*?\*\/"
        data = re.sub(comment_regex, '', data)

        return data

    hide_cursor()
    file_list = parse_args()
    connection = sql.init_conn()
    executor = file.get_executor(
        format_file, sql.parse, sql.get_executor(connection))
    iterate_over_files(file_list, executor)
    show_cursor()


main()
