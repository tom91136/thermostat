import history
import utils
import time
import datetime
import config
import ds18b20
import hal

__author__ = 'Tom'


def _tocurrentdate(timestamp):
    given = datetime.datetime.fromtimestamp(timestamp)
    today = datetime.datetime.today()
    edgecase = (0, 6)
    weekday = today.weekday()
    given_weekday = given.weekday()
    if weekday in edgecase or given_weekday in edgecase and weekday != given_weekday:
        delta = -1 if given < today else 1
    else:
        delta = given_weekday - weekday
    shifted = today + datetime.timedelta(days=delta)
    shifted.replace(hour=given.hour, minute=given.minute, second=given.second)
    return shifted


def _isinrange(start, end, value):
    return start <= value <= end


def gettargettemperature():
    CONFIG = config.load()
    temperature = CONFIG["override"]
    if int(temperature) > 0:
        print(temperature)
        return int(temperature)

    blocks = [e for e in CONFIG["timetable"] if
              _isinrange(_tocurrentdate(e["start"] / 1e3), _tocurrentdate(e["end"] / 1e3),
                         datetime.datetime.today())]

    # print(blocks)
    if not blocks:
        print(-1)
        return -1
    elif len(blocks) > 1:
        raise AssertionError("block overlay:" + ''.join(blocks))
    else:
        print(blocks[0]["title"])
        return int(blocks[0]["title"])


def heatersockets():
    CONFIG = config.load()
    heaters = []
    for i, val in enumerate(CONFIG["heater_socket"]):
        if CONFIG["socket"][i] and val:
            heaters.append(i)
    return heaters


def run():
    target = gettargettemperature()
    temp = ds18b20.readtemperature()
    history.log(temp, target, temp < target)
    if target > 0:
        hal.initialize()
        hal.commandheater(heatersockets(), temp < target)
    print("engine run")
    return True


run()


