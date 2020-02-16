var socket = null;

var App = new Vue({
    el: '#AppVue',
    data: {
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
        tasks: {
            raw: [],
            sortType: 'cpu',
            sortAsc: -1,
            limit: 10,
            list: [],
        },
        cpus: [],
    },
    methods: {
        init: function () {
            socket = io('http://localhost:3000');

            socket.on('data', function (data) {
                console.log('data', data);

                App.totalMemory = data.totalMemory;
                App.totalMemoryFormatted = data.totalMemoryFormatted;

                App.freeMemory = data.freeMemory;
                App.freeMemoryFormatted = data.freeMemoryFormatted;

                App.usedMemory = data.usedMemory;
                App.usedMemoryFormatted = data.usedMemoryFormatted;

                App.cpuUsage = data.cpuUsage;
                App.cpuUsageFormatted = data.cpuUsageFormatted;

                App.loadavg = data.loadavg;

                App.uptime = data.uptime;

                App.tasks.raw = data.tasks;

                App.cpus = data.cpus;

                App.sortList();
            });
        },
        emit: function () {
            socket.emit('chat message', 'opa!!!');
        },
        sortList: function () {
            var list = App.tasks.raw.slice()

            list.sort(function (a, b) {
                if (a[App.tasks.sortType] > b[App.tasks.sortType]) return App.tasks.sortAsc;
                else if (a[App.tasks.sortType] < b[App.tasks.sortType]) return App.tasks.sortAsc * -1;
                else return 0;
            });

            if (App.tasks.limit) {
                App.tasks.list = list.slice(0, App.tasks.limit);
            } else {
                App.tasks.list = list.slice();
            }
        },
        selectSortType: function (sortType) {
            if (App.tasks.sortType == sortType) App.tasks.sortAsc *= -1;
            // else App.tasks.sortAsc = 1;
            App.tasks.sortType = sortType;
            App.sortList();
        },
    },
});

App.init();