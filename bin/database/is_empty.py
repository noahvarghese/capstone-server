#!/usr/bin/env python
import sys
import getopt
import dotenv
import os
from lib.sql import init_conn, has_rows
from typing import List


help_menu = ("name\t--name/-n\tSets the database name to check\n" +
             "path\t--path\t\tSets the .env file path [optional]\n" +
             "help\t--help/-h\tPrints this menu\n")


def parse_args() -> List[str]:
    try:
        opts, args = getopt.getopt(sys.argv[1:], "h:npt", [
                                   "name=", "path=", "tables="])
    except Exception as e:
        print("Exception", str(e))
        sys.exit(help_menu)

    env = None
    tables = []

    for (opt, arg) in opts:
        if opt in ('-n', '--name'):
            env = arg
        elif opt == "--path" and arg != "":
            dotenv.load_dotenv(arg)
        elif opt in ('-t', '--tables'):
            tables = arg.split(",")
        else:
            sys.exit(help_menu)

    if env == None or len(tables) == 0:
        sys.exit(help_menu)
    else:
        db_name = os.getenv("DB")

        if not (env is None):
            if len(env) > 0:
                db_name += f'{("_","")[env[0] == "_"]}'
            db_name += env

        os.environ["DB_NAME"] = db_name

    return tables


def main():
    tables = parse_args()
    connection = init_conn(set_database=True)

    for table in tables:
        if has_rows(connection, table):
            exit(1)


main()
