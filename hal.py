__author__ = 'Tom'
DEBUG = True

MAPPING = {0: 7, 1: 8, 2: 9}

if not DEBUG:
    import RPi.GPIO as GPIO


def initialize():
    if not DEBUG:
        GPIO.setmode(GPIO.BOARD)


def commandheater(indices, on):
    for index in indices:
        pin = MAPPING.get(index)
        if not DEBUG:
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.HIGH if on else GPIO.LOW)
        else:
            print(pin, " ->", on)


