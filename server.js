const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

requestContents = {
    "method": "main",
    "video_name": "new.mp4",
    "video_dir": "27-03-2020_11-40-10"
}

io.on('connection', function(socket) {
    console.log('a user connected')
    onClick()

    socket.on('mainStatus', function(msg) {
        console.log('CP: ' + JSON.stringify(msg))
        if (msg['status'] == 'finish') {
            io.emit('kill')
        }
    })

})

function onClick() {
    io.emit('run main', {"video_name": "new.mp4", "video_dir": "27-03-2020_11-40-10"})
}

function kill() {
    io.emit('kill')
}

http.listen(4646, function() {
    console.log('listenning on: 4646')
})