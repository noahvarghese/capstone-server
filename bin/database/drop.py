#!/usr/bin/env python

import dotenv
import getopt
import os
import sys
from lib.sql import init_conn


help_menu = ("name\t--name/-n\tSets the database name to check\n" +
             "path\t--path\t\tSets the .env file path [optional]\n" +
             "help\t--help/-h\tPrints this menu\n")


def parse_args() -> str:
    try:
        opts, args = getopt.getopt(sys.argv[1:], "h:np", [
                                   "help", "name=", "path="])
    except Exception as e:
        print("Exception", str(e))
        sys.exit(help_menu)

    env = None

    for (opt, arg) in opts:
        if opt in ('-n', '--name'):
            env = arg
        elif opt in ('-p', '--path'):
            dotenv.load_dotenv(arg)
        else:
            sys.exit(help_menu)

    if env == None:
        sys.exit(help_menu)
    else:
        db_name = os.getenv("DB")

        if not (env is None):
            if len(env) > 0:
                db_name += f'{("_","")[env[0] == "_"]}'
            db_name += env

        return db_name


def main():
    database = parse_args()
    connection = init_conn(set_database=True)
    cursor = connection.cursor()
    cursor.execute(f'DROP DATABASE {database};')
    print(f'[ Event ]: Database {database} deleted')


main()
