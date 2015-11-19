__author__ = 'Tom'
import os


def localfile(filename):
    return os.path.join(os.path.dirname(__file__), filename)