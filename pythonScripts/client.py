import socketio
import os
from process import main
import time

sio = socketio.Client()

@sio.on('run main')
def run(data):
    if main(sio, data['videoName'], data['videoDir']) == "FINISH":
        sio.emit("mainStatus", {"status": "finish", "progress": "Terminé"})
    print('running main with params: ', data)


sio.connect('http://localhost:4646')