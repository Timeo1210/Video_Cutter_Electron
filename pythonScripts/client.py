import zmq
import json
import time

print("Connecting to hello world server…")
context = zmq.Context();
#socket = context.socket(zmq.PUSH)
#socket.connect("tcp://localhost:4343")
#socket.RCVTIMEO = 5000
#socket_recv = context.socket(zmq.PULL)
#socket_recv.connect("tcp://127.0.0.1:4344");

#socket_send = context.socket(zmq.PUSH)
#socket_send.connect("tcp://127.0.0.1:4343")

socket = context.socket(zmq.PAIR)
socket.connect("tcp://127.0.0.1:4343");

msg = []
requestContents = {
    "method": "main",
    "video_name": "new.mp4",
    "video_dir": "20-02-2020_14-35-55"
}

#socket.send_json({"method": "test"})
socket.send_json(requestContents)
while True:
    newMsg = socket.recv_json()
    if newMsg['progress'] == "finish":
        print("EXIT LOOP")
        break
    print(newMsg)
    msg.append(newMsg)

print(msg)
socket.send_json({"method": "exit"})

requestContents = {
    "method": "main",
    "video_name": "new.mp4",
    "video_dir": "20-02-2020_14-35-55"
}