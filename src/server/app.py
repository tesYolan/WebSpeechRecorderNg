from flask import Flask, request, url_for, abort
import os
import sys
import json
import logging
import flask
from flask.helpers import flash
from flask_cors import CORS, cross_origin
from time import gmtime, strftime
app = Flask(__name__)
CORS(app)
logging.getLogger('flask_cors').level = logging.DEBUG

@app.route('/')
def hello_world():
    return 'Hello, REST API for WebSpeechRecorder!'


@app.route("/project/<projectId>")
def project(projectId):
    # how do i do this this? read a file? yeah. 
    project = {}
    if os.path.exists('project/{}.json'.format(projectId)):
        with open('project/{}.json'.format(projectId)) as t:
            text = t.read()
            project = json.loads(text)
    else: 
        abort(404)
    # https://stackoverflow.com/questions/13081532/return-json-response-from-flask-view
    # returns a dict and supposedly flask changes it to json

    return project

@app.route("/project/<projectId>/session/<sessionId>", methods=['GET','PATCH'])
def project_session_items(projectId, sessionId):
    return '', 204
@app.route("/project/<projectId>/session/<sessionId>/recfile")
def project_session(projectId, sessionId):
    with open("project/{}/session/{}/recfile.json".format(projectId, sessionId), 'rt') as f:
        text = f.read()
        list_items = json.loads(text)
    return flask.Response(json.dumps(list_items), mimetype='application/json')
        
@app.route("/session/<sessionId>", methods=['GET','PATCH'])
def session(sessionId):

    session = {}
    if os.path.exists('session/{}.json'.format(sessionId)):
        with open('session/{}.json'.format(sessionId)) as f:
            text = f.read()
            session = json.loads(text) 

        if request.method == 'PATCH':
            data = request.json
            for i in data:
                session[i] = data[i]
            
            with open('session/{}.json'.format(sessionId), 'wt') as f:
                f.write(json.dumps(session, indent=4))
    else:
        # checkout this: https://flask.palletsprojects.com/en/2.0.x/errorhandling/
        abort(404)

    return session

@app.route("/script/<scriptId>")
def script(scriptId):
    script = {}
    # Notice the description of the file isn't that much particularly pertinent. 
    if os.path.exists('script/{}.json'.format(scriptId)):
        with open('script/{}.json'.format(scriptId)) as f:
            text = f.read()
            script = json.loads(text)
            return script
    else:
        return abort(404)


@app.route("/session/<sessionId>/recfile/<itemcode>", methods=['POST', 'GET'])
def recording_saver(sessionId, itemcode):
    # TODO there is a lot to be done here. What is the format of the request. I would just overwrite the file. 
    if request.method == 'POST':
        data = request.data
        with open("session/{}.json".format(sessionId), 'rt') as f:
            text = f.read()
            session = json.loads(text)
        print(session["script"])
        if os.path.exists('script/{}-script.json'.format(session["script"])):
            with open('script/{}-script.json'.format(session["script"])) as f:
                text = f.read()
                script = json.loads(text)

        with open("project/{}/session/{}/recfile/{}.wav".format(session['project'], sessionId, itemcode), 'wb') as f:
            f.write(request.data)

        with open("project/{}/session/{}/recfile.json".format(session['project'], sessionId), 'rt') as f:
            text = f.read()
            list_items = json.loads(text)
            recfile = {}

            recfile['recordingFileId'] = itemcode
            recfile['session'] = sessionId
            recfile['date'] = strftime("%Y-%m-%dT%H:%M:%S", gmtime())
            recfile['recording'] = {
                "mediaitems": [{
                    "annotationTemplate" : True,
                    "text" : script[itemcode]
                }], 
                "itemcode": "N0", 
                "recduration": len(request.data),
                "recinstructions" : {
                    "recinstructions" : "Please read:"
                }
            }
            list_items.append(recfile)
        with open("project/{}/session/{}/recfile.json".format(session['project'], sessionId), 'wt') as f:
            f.write(json.dumps(list_items, indent=4))


        return "", 204
    if request.method == 'GET':
        with open("session/{}".format(sessionId), 'rt') as f:
            text = f.read()
            session = json.loads(text)

        with open("project/{}/session/{}/recfile/{}.wav".format(session['project'], sessionId, itemcode), 'rb') as f:
            data = f.read()
        response = flask.Response(mimetype="audio/wav")
        response.data = data
        return response



@app.route('/recordingfile/<recordingFileId>', methods=['POST', 'PATCH'])
def recording(recordingFileId):
    if request.method == 'POST':
        if (os.path.exists('recordingfile/{}.json'.format(recordingFileId))):
            with('recordingfile/{}.json'.format(recordingFileId), 'r') as f:
                text = f.read()
                script = json.loads(text)
            data = request.json
            for i in data:
                script[i] = data[i]
            with('recordingfile/{}.json'.format(recordingFileId), 'wt') as f:
                f.write(json.dumps(script, indent=4))
                return 'Success'