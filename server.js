var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var ip = require('ip')
var keypress = require('keypress')
var Kefir = require('kefir')

var HID = require('node-hid');

// Server setup

var port = 7000

app.use(express.static('public'))
server.listen(port)

var streams = []

io.on('connection', function (socket) {

    // Get key command stream from joystick
    
        var devices = HID.devices()

        joystickId = 'USB_040b_6533_14200000'

        if (devices.find(device => device.path === joystickId)) {

            var device = new HID.HID(joystickId)
            
            var joystickStream = Kefir
                .fromEvents(device, 'data', (data) => {
                    var key = 'other'
                    if (data[0] == 0) key = 'right'
                    if (data[0] == 255) key = 'left'
                    if (data[1] == 0) key = 'down'
                    if (data[1] == 255) key = 'up'
                    if (data[2] == 1) key = 'ok'
                    if (data[2] == 2) key = 'back'
                    return key
                })
        
            streams.push(joystickStream)    
        }
    
    // Get key command streams from clients

    var socketStream = Kefir.fromEvents(socket, 'key')
    streams.push(socketStream)

    // Merge the key command streams and send them to clients

    Kefir.merge(streams)
        .onValue(function (value) {
            socket.broadcast.emit('key', value)
        })
        .log()

    // Stage feedback, optional

    socket.on('state', function (state) {
        socket.broadcast.emit('state', state);
    });
        
})

console.log(
  '\n' +
  'Server is running\n' +
  'In this machine: http://localhost:' + port + '\n' +
  'In local network: http://' + ip.address() + ':' + port + '\n' +
  'To stop server, press Ctrl+C\n'

)