const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const os = require('os')
const osUtils = require('os-utils')
const { snapshot } = require('process-list')
const prettyBytes = require('pretty-bytes')

var interval = null
var users = 0

async function getTasks() {
    return await snapshot('pid', 'name', 'cpu', 'pmem');
}

function sendData() {
    if (users && !interval) {
        interval = setInterval(() => {
            getTasks().then(tasks => {
                const data = {
                    totalMemory: 0,
                    totalMemoryFormatted: '',
                    freeMemory: 0,
                    freeMemoryFormatted: '',
                    usedMemory: 0,
                    usedMemoryFormatted: '',
                    cpuUsage: 0,
                    cpuUsageFormatted: '',
                    loadavg: [],
                    uptime: {
                        raw: 0,
                        days: 0,
                        hours: 0,
                        minutes: 0,
                        seconds: 0,
                        rest: 0,
                        formatted: '',
                    },
                    tasks: [],
                    cpus: [],
                }

                data.totalMemory = parseInt(os.totalmem())
                data.totalMemoryFormatted = prettyBytes(data.totalMemory)

                data.freeMemory = parseInt(os.freemem())
                data.freeMemoryFormatted = prettyBytes(data.freeMemory)

                data.usedMemory = parseInt(data.totalMemory - data.freeMemory)
                data.usedMemoryFormatted = prettyBytes(data.usedMemory)

                data.loadavg = os.loadavg().map(a => a.toFixed(2))

                data.uptime = {
                    raw: parseInt(os.uptime()),
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    rest: 0,
                    formatted: '',
                }

                data.uptime.rest = data.uptime.raw

                data.uptime.days = parseInt(data.uptime.rest / 24 / 60 / 60)
                data.uptime.rest -= (data.uptime.days * 24 * 60 * 60)

                data.uptime.hours = parseInt(data.uptime.rest / 60 / 60)
                data.uptime.rest -= (data.uptime.hours * 60 * 60)

                data.uptime.minutes = parseInt(data.uptime.rest / 60)
                data.uptime.rest -= (data.uptime.minutes * 60)

                data.uptime.seconds = data.uptime.rest

                delete data.uptime.rest

                if (data.uptime.days) {
                    data.uptime.formatted += data.uptime.days + ' day' + (data.uptime.days > 1 ? 's' : '') + ', '
                }

                data.uptime.formatted += (data.uptime.hours + '').padStart(2, '0') + ':' + (data.uptime.minutes + '').padStart(2, '0') + ':' + (data.uptime.seconds + '').padStart(2, '0')

                for (var i in tasks) {
                    let task = {
                        pid: 0,
                        name: '',
                        cpu: 0,
                        cpuFormatted: '',
                        memory: 0,
                        memoryFormatted: '',
                        usedMemory: 0,
                        usedMemoryFormatted: '',
                    }

                    task.pid = tasks[i].pid
                    task.name = tasks[i].name
                    task.cpu = tasks[i].cpu
                    task.cpuFormatted = task.cpu.toFixed(2)
                    task.memory = parseInt(tasks[i].pmem)
                    task.memoryFormatted = prettyBytes(task.memory)
                    task.usedMemory = parseFloat(task.memory / data.totalMemory)
                    task.usedMemoryFormatted = (task.usedMemory * 100).toFixed(2)

                    data.tasks.push(task)
                }

                const cpus = os.cpus()
                for (var i in cpus) {
                    let speed = parseFloat(cpus[i].speed / 2000)
                    let cpu = {
                        id: parseInt(i) + 1,
                        speed: speed,
                        speedFormatted: (speed * 100).toFixed(2),
                    }

                    data.cpus.push(cpu)
                }

                osUtils.cpuUsage(value => {
                    data.cpuUsage = parseFloat(value)
                    data.cpuUsageFormatted = (data.cpuUsage * 100).toFixed(2)

                    console.log('Send data', (new Date()))
                    io.emit('data', data)
                });


            })

        }, 1000)
    }

    // if (!users && interval) clearInterval(interval)
}

app.use(express.static('public'))

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html')
})

io.on('connection', socket => {
    users++
    sendData()

    socket.on('disconnect', () => {
        users--
        sendData()
    })
})

http.listen(3000, function () {
    console.log('listening on *:3000')
})
