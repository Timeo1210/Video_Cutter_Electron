import zmq
from process import main
import time

context = zmq.Context();
socket = context.socket(zmq.PAIR)
socket.bind("tcp://127.0.0.1:4343");

while True:
    print('Online')

    messages = socket.recv_json()

    if messages['method'] == "main":
        output = main(socket, messages['video_name'], messages['video_dir']);
        socket.send_json({"progress": "finish"})
    if messages['method'] == "test":
        socket.send_json({"result": "part1"})
        time.sleep(4)
        socket.send_json({"result": "finish"})
    if messages['method'] == "exit":
        print("exit")
        exit()


