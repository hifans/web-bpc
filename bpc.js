(function() {
    var freq = 68500/5;
    var ctx;
    var signal;
    var debug = true;

    var AudioContext = window.AudioContext || window.webkitAudioContext;

    function dump_msg(bitarray) {
        console.log("bitarray len="+bitarray.length);
        console.log(bitarray);
        for(i=0;i<3;i++) {
		console.log("P0=" + bitarray[i*40+0] + " " + bitarray[i*40+1]);
		console.log("P1=" + bitarray[i*40+2] + " " + bitarray[i*40+3]);
		console.log("P2=" + bitarray[i*40+4] + " " + bitarray[i*40+5]);
		console.log("Hour="+ bitarray[i*40+6] + " " + bitarray[i*40+7]+ " "+bitarray[i*40+8] + " " + bitarray[i*40+9] + ":" +  (bitarray[i*40+6]*8 + bitarray[i*40+7]*4 + bitarray[i*40+8]*2 + bitarray[i*40+9]));
		console.log("Min="+ bitarray[i*40+10] + " " + bitarray[i*40+11]+ " "+bitarray[i*40+12] + " " + bitarray[i*40+13] + " "+bitarray[i*40+14] + " " + bitarray[i*40+15] + ":" +  
                        ( bitarray[i*40+10]*32 + bitarray[i*40+11]*16+ bitarray[i*40+12]*8 + bitarray[i*40+13]*4 + bitarray[i*40+14]*2 + bitarray[i*40+15]));
		console.log("WeekDay="+ bitarray[i*40+16] + " " + bitarray[i*40+17]+ " "+bitarray[i*40+18] + " " + bitarray[i*40+19] + ":" +  (bitarray[i*40+16]*8 + bitarray[i*40+17]*4 + bitarray[i*40+18]*2 + bitarray[i*40+19]));
		console.log("P3=" + bitarray[i*40+20] + " " + bitarray[i*40+21]);
		crc = 0;
		for(j=2;j<20;j++)
			crc = crc ^ bitarray[i*40+j];
		console.log("crc="+crc);
		if(bitarray[i*40+21]==crc) console.log("CRC OK");
		console.log("Day="+ bitarray[i*40+22] + " " + bitarray[i*40+23]+ " "+bitarray[i*40+24] + " " + bitarray[i*40+25] + " "+bitarray[i*40+26] + " " + bitarray[i*40+27] + ":" +  
                        ( bitarray[i*40+22]*32 + bitarray[i*40+23]*16+ bitarray[i*40+24]*8 + bitarray[i*40+25]*4 + bitarray[i*40+26]*2 + bitarray[i*40+27]));
		console.log("Month="+ bitarray[i*40+28] + " " + bitarray[i*40+29]+ " "+bitarray[i*40+30] + " " + bitarray[i*40+31] + ":" +  (bitarray[i*40+28]*8 + bitarray[i*40+29]*4 + bitarray[i*40+30]*2 + bitarray[i*40+31]));
		console.log("Year="+ bitarray[i*40+32] + " " + bitarray[i*40+33]+ " "+bitarray[i*40+34] + " " + bitarray[i*40+35] + " "+bitarray[i*40+36] + " " + bitarray[i*40+37] + ":" +  
                        ( bitarray[i*40+32]*32 + bitarray[i*40+33]*16+ bitarray[i*40+34]*8 + bitarray[i*40+35]*4 + bitarray[i*40+36]*2 + bitarray[i*40+37]));
		console.log("P4=" + bitarray[i*40+38] + " " + bitarray[i*40+39]);
		crc = 0;
		for(j=22;j<38;j++)
			crc = crc ^ bitarray[i*40+j];
		console.log("crc="+crc);
		if(bitarray[i*40+39]==crc) console.log("CRC OK");
        }
    }
    function schedule(date) {
        var now = Date.now();
        if (debug) {
            console.log(now.toString());
        }

        var start = date.getTime();
        var offset = (start - now) / 1000 + ctx.currentTime;
        var minute = date.getMinutes();
        var hour = date.getHours();
        var year = date.getFullYear() % 100;
        var week_day = date.getDay();
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var array = [];
        var bitarray = [];
        var pm = 0;
        if (hour >= 13) {
            hour -= 12;
            pm = 1;
        }

        function P0(s) {
            array.push(0);
            bitarray.push(0);
            bitarray.push(0);
        }

        var pa;

        function bit(s, value) {
            var tm = 0;
            if (value == 0)
                tm = 0.1;
            else if (value == 1)
                tm = 0.2;
            else if (value == 2)
                tm = 0.3;
            else if (value == 3)
                tm = 0.4;
            else console.log("error " + value);
            array.push(tm);
            bitarray.push((value>>1)&1);
            bitarray.push(value&1);
            var t = s + offset;
            if (t < 0) return value;
            var osc = ctx.createOscillator();
            osc.type = "square";
            osc.frequency.value = freq;
            osc.start(t);
            osc.stop(t + tm);
            osc.connect(ctx.destination);
            return value;
        }

        for (i = 0; i < 3; i++) {
            // second 0
            P0(0 + i * 20);
            crc = 0;

            // second 1
            b = i; // P1
            bit(1 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);

            // second 2
            b = 0; // P2=0
            bit(2 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);

            // second 3 & 4, 小时
            b = hour >> 2;
            bit(3 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);
            b = hour & 3;
            bit(4 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);

            // second 5,6,7, 分钟
            b = minute >> 4;
            bit(5 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);
            b = (minute >> 2) & 3;
            bit(6 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);
            b = minute & 3;
            bit(7 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);

            // second 8,9 星期
            b = week_day >> 2;
            bit(8 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);
            b = week_day & 3;
            bit(9 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);

            // second 10, pm&crc
            b = pm << 1;
            b = b + crc;
            bit(10 + i * 20, b);


            crc = 0;
            // second 11,12,13 日
            b = day >> 4;
            bit(11 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);
            b = (day >> 2) & 3;
            bit(12 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);
            b = day & 3;
            bit(13 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);

            // second 14,15 月
            b = month >> 2;
            bit(14 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);
            b = month & 3;
            bit(15 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);

            // second 16,17,18 年
            b = (year >> 4) & 3;
            bit(16 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);
            b = (year >> 2) & 3;
            bit(17 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);
            b = year & 3;
            bit(18 + i * 20, b);
            crc = crc ^ (b & 1) ^ ((b >> 1) & 1);

            // second 19, 年&crc
            b = year >> 6;
            b = b + crc;
            bit(19 + i * 20, b);
        }

        console.log(array);
        if(debug)
            dump_msg(bitarray);
        return array;
    }

    var intervalId;

    function start() {
        ctx = new AudioContext();
        var now = Date.now();
        var t = Math.floor(now / (60 * 1000)) * 60 * 1000;
        var next = t + 60 * 1000;
        var delay = next - now - 1000; // 毎分0秒ピッタリの少し前にタイマーをセットする
        if (delay < 0) {
            t = next;
            delay += 60 * 1000;
        }
        signal = schedule(new Date(t));

        setTimeout(function() {
            interval();
            intervalId = setInterval(interval, 60 * 1000);
        }, delay);

        function interval() {
            t += 60 * 1000;
            signal = schedule(new Date(t));
        }
    }

    function stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        if (ctx) {
            ctx.close();
            ctx = null;
        }
        signal = undefined;
    }

    var control_button = document.getElementById("control-button");
    var play_flag = false;

    control_button.addEventListener('click', function() {
        if (play_flag) {
            control_button.innerText = "Start";
            play_flag = false;
            stop();
        } else {
            control_button.innerText = "Stop";
            play_flag = true;
            start();
        }
    });

    var nowtime = document.getElementById('time');
    var canvas = document.getElementById('canvas');
    var ctx2d = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;

    render();

    function render() {
        var nnow = new Date();

        nowtime.innerText = nnow.toString();

        var i;
        ctx2d.clearRect(0, 0, w, h);
        if (!signal) {
            requestAnimationFrame(render);
            return;
        }
        var now = Math.floor(Date.now() / 1000) % 60;

        for (i = 0; i < signal.length; i++) {
            if (i == now) {
                ctx2d.fillStyle = "#FF0000";
            } else {
                if (signal[i] < 0.15) ctx2d.fillStyle = "#7F0000";
                else if (signal[i] < 0.25) ctx2d.fillStyle = "#7F7F00";
                else if (signal[i] < 0.35) ctx2d.fillStyle = "#7F7F7F";
                else ctx2d.fillStyle = "#007F00";
            }
            ctx2d.fillRect((i % 20) * 30, Math.floor(i / 20) * 80, 30 * signal[i] * 2, 60);
        }
        requestAnimationFrame(render);
    }

})();
