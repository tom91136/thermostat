import utils
import os
import json

__author__ = 'Tom'

CONFIG_FILE = utils.localfile("config.json")


def load():
    with open(CONFIG_FILE) as outfile:
        return json.load(outfile)


def save(config):
    with open(CONFIG_FILE, "w") as outfile:
        json.dump(config, outfile, indent=4, sort_keys=True)
