import engine
import history
import ds18b20
import config
import json
import utils
from flask import Flask, request
from flask.ext.restful import Resource, Api
from flask import render_template

__author__ = 'Tom'

app = Flask(__name__)
api = Api(app)


@app.route('/')
def index():
    CONFIG = config.load()
    return render_template('index.html',
                           config=CONFIG,
                           timetable=CONFIG["timetable"])


class ThermostatConfig(Resource):
    def get(self, key):
        CONFIG = config.load()
        if key is None:
            return CONFIG, 200
        elif key not in CONFIG:
            return {"result": "key " + key + " not found"}, 404
        return CONFIG[key]

    def put(self, key):
        CONFIG = config.load()
        if key in CONFIG:
            print(request.form['data'])
            CONFIG[key] = json.loads(request.form['data'])
            config.save(CONFIG)
            return {"result": "ok"}, 201
        else:
            return {"result": "key " + key + " not found"}, 404


class Temperature(Resource):
    def get(self):
        return round(ds18b20.readtemperature(), 1)


class Engine(Resource):
    def get(self, key):
        return {
            "currenttarget": engine.gettargettemperature(),
            'run': engine.run(),
        }.get(key, ({"result": "key " + key + " not found"}, 404))


class History(Resource):
    def get(self, limit=10):
        return history.read(limit)


api.add_resource(ThermostatConfig, '/api/<string:key>')
api.add_resource(Temperature, '/api/temperature')
api.add_resource(Engine, '/api/engine/<string:key>')
api.add_resource(History, '/api/history/<int:limit>')


if __name__ == '__main__':
    app.debug = True
    app.run(host="0.0.0.0", port=80, debug=True)
