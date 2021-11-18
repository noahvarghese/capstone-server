#!/usr/env/python
from git import Repo
import os


def get_current_branch() -> str:
    repo = Repo(os.getcwd())
    return repo.active_branch.name
