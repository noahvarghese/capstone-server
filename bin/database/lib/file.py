from os import path, listdir
from os.path import abspath, isdir, join
from lib.screen import clear
from typing import Callable, List


def iterate_over_files(file_list, func, file_extension=".sql", prev_path="") -> None:
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

            iterate_over_files(list_dir, func, file_extension, file_path)
        else:
            if (file_path.endswith(file_extension)):
                func(file_path)
    clear()


def read(file_path) -> List[str]:
    with open(file_path) as file:
        data = file.read()

    return data


def get_executor(formatter, parser, interpreter) -> Callable[[str], None]:
    return lambda file_path: execute(file_path, formatter, parser, interpreter)


def execute(file_path, formatter, parser, interpreter) -> None:
    clear()
    print(f'[ Event ]: Reading file: {file_path}')
    data = read(file_path)
    data = formatter(data)
    data = parser(data)
    print(f'[ Event ]: Executing file...')
    interpreter(data)
