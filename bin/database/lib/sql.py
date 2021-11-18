#!/usr/bin/env python
import mysql
import mysql.connector
import os
import re
import sys
from lib.screen import print_progress_bar
from typing import Callable, List, Union


def init_conn(set_database: Union[None, bool] = None) -> mysql.connector.MySQLConnection:
    db = None

    if (set_database):
        db = mysql.connector.connect(
            host=os.getenv("DB_URL"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PWD"),
            database=os.getenv("DB_NAME")
        )
    else:
        db = mysql.connector.connect(
            host=os.getenv("DB_URL"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PWD"),
        )
    return db


def has_rows(connection, table) -> bool:
    cursor = connection.cursor()
    cursor.execute(f'SELECT COUNT(*) as count FROM {table};')
    result = cursor.fetchall()
    for x in result:
        (total,) = x
        if total > 0:
            return True
    return False


def parse(data) -> List[str]:
    sql = []

    # Keep these for secondary parsing
    # Split from // to ;
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

    # Split by ';'
    sql_regex = r".*?\;"

    matches = re.findall(sql_regex, data, flags=re.DOTALL+re.MULTILINE)

    for statement in matches:
        sql.append(statement)

    return sql


def get_executor(db: mysql.connector.MySQLConnection) -> Callable[[str], None]:
    return lambda sql: execute(db, sql)


def execute(db, sql) -> None:
    print(f'[ INFO ]: Executing on {os.getenv("DB_NAME")}')
    for i, statment in enumerate(sql):
        print_progress_bar(i + 1, len(sql), prefix='Progress:',
                           suffix='Complete', length=50)

        cursor = db.cursor()
        try:
            cursor.execute(statment)
            db.commit()
        except Exception as e:
            cursor.close()
            db.close()
            sys.exit(f'[ Error ]: {str(e)}\n{statement}\nSQL query failed\n')
