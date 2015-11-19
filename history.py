import time
import utils
import json

__author__ = 'Tom'

HISTORY_FILE = utils.localfile("history.log")


def _tail(path, window=20):
    """
    Returns the last `window` lines of file `f` as a list.
    """
    with open(path, "r") as f:
        if window == 0:
            return []
        BUFSIZ = 4096
        f.seek(0, 2)
        bytes = f.tell()
        size = window + 1
        block = -1
        data = []
        while size > 0 and bytes > 0:
            if bytes - BUFSIZ > 0:
                # Seek back one whole BUFSIZ
                f.seek(block * BUFSIZ, 2)
                # read BUFFER
                data.insert(0, f.read(BUFSIZ))
            else:
                # file too small, start from begining
                f.seek(0, 0)
                # only read what was not read
                data.insert(0, f.read(bytes))
            linesFound = data[0].count('\n')
            size -= linesFound
            bytes -= BUFSIZ
            block -= 1
        return ''.join(data).splitlines()[-window:]


def log(current, target, heaterstate):
    with open(HISTORY_FILE, "a") as history:
        history.write(
            json.dumps({"current": current, "target": target, "heaterstate": heaterstate,
                        "time": int(round(time.time() * 1e3))}) + "\n")


def read(record):
    return [json.loads(line) for line in _tail(HISTORY_FILE, record)]