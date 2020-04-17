import socketio
import os
from process import main
import time

sio = socketio.Client()

def fakeMain(socket):
    socket.emit("mainStatus", {"status": "inProgress", "progress": "Converting Video to Audio for analyse..."})
    time.sleep(3)
    socket.emit("mainStatus", {"status": "inProgress", "progress": "Analyse Audio..."})
    time.sleep(0.25)
    socket.emit("mainStatus", {"status": "inProgress", "progress": "Cutting Video..."})
    time.sleep(0.25)
    socket.emit("mainStatus", {"status": "inProgress", "progress": "Cut 1/2"})
    time.sleep(4)
    socket.emit("mainStatus", {"status": "inProgress", "progress": "Cut 2/2"})
    time.sleep(6)
    return "FINISH"

@sio.event
def connect():
    print('connection etablished')

@sio.on('kill')
def kill():
    print('killing...')
    os._exit(0)

@sio.on('run main')
def run(data):
    if main(sio, data['videoName'], data['videoDir']) == "FINISH":
        sio.emit("mainStatus", {"status": "finish", "progress": "Terminé"})
    print('running main with params: ', data)

@sio.on('run devMain')
def devMain(data):
    if fakeMain(sio) == "FINISH":
        sio.emit("mainStatus", {"status": "finish", "progress": "Terminé"})
    print('running main with params: ', data)

@sio.on('run devTest')
def devTest(data):
    DIRPATH = os.path.join(os.getcwd(), "resources", "Frameworks", "ffmpeg.exe")
    sio.emit('console', DIRPATH)
    print(DIRPATH)

@sio.on('run devPing')
def devping(data):
    print(data)
    sio.emit('pong', 'pong')

@sio.event
def disconnect():
    print('disconnected from server')

sio.connect('http://localhost:4646')
#sio.emit('test', {'message': 'hello world'})