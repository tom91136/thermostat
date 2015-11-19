import os.path
import glob



# the lack of semicolon is killing me!!
DEFAULT_DS18B20_DIR = "/sys/devices/w1_bus_master1/28-*"
DEBUG = True

# TODO modprobe w1_gpio/therm

# thermometer ROM command 44h
def DS18B20convertT(location):
	datapath = location + "/w1_slave"
	print
	datapath
	file = open(datapath)
	data = file.read()
	file.close()
	# the sensor returns string with scratchpad data, CRC, and the temperature all together
	secondline = data.split("\n")[1]
	temperaturedata = secondline.split(" ")[9]
	return float(temperaturedata[2:]) / 1000


# check if DS18B20 is connected
def detectDS18B20():
	sensors = glob.glob(DEFAULT_DS18B20_DIR)
	if not sensors:
		raise IOError("DS18B20 is not found at: " + DEFAULT_DS18B20_DIR)
	else:
		# let's get the first one for now
		return sensors[0]


def readtemperature():
	return DS18B20convertT(detectDS18B20()) if not DEBUG else -1
	#return DS18B20convertT(detectDS18B20())
