'use strict';

var audioSource = document.querySelector('select#audioSource');
var audioOutput = document.querySelector('select#audioOutput');
/*视频来源*/
var videoSource = document.querySelector('select#videoSource');
var videoResolution = document.querySelector('select#resolution');
//视频效果标签
// var filtersSelect = document.querySelector('select#filter');
//用于拍照的btn和显示截取快照的图片
// var snapshort = document.querySelector('button#snapshort');
// var picture = document.querySelector('canvas#picture');
// picture.width = 320;
// picture.height = 240;

//用于显示视频流参数信息
// var divConstraints = document.querySelector('div#constraints');
//获取到video标签
var videoplay = document.querySelector('video#player');
//var audioplay = document.querySelector('audio#audioplayer');
//录制相关
var recvideo = document.querySelector('video#recplayer');
var btnRecord = document.querySelector('button#record');
var btnStop = document.querySelector('button#stop');
var btnPlay = document.querySelector('button#recplay');
var btnDownload = document.querySelector('button#download');


//测试按钮
// var test = document.querySelector('button#test');

var buffer;
var mediaRecorder;
let mixedStream = null;
var micNumber;
/**设置和变量配置*/

/*getDisplayMedia的约束*/
var constraints = {
    video : {
        //修改视频宽高
        width : {ideal:3840},
        height : {ideal:2160},
        frameRate : 30
    },
    audio: true
};

//将流赋值给video标签
function gotMediaStream(stream){
    mixedStream = stream;

    if (mixedStream.getVideoTracks().length<0){
        console.log("In gotMediaStream mixedStream is null")
    } else {
        console.log("In gotMediaStream mixedStream has video track")
    }
    console.log("mixedStream type is: "+ mixedStream.className);
   // videoplay.muted = true;
    videoplay.srcObject = stream;
    //audioplay.srcObject = stream;
    //视频的所有轨
    var videoTrack = stream.getVideoTracks()[0];
    var videoConstraints = videoTrack.getSettings();

    // divConstraints.textContent = JSON.stringify(videoConstraints, null, 2);

    /*监听‘停止共享事件’*/
    videoTrack.onended = ()=>{
        /*如果在视屏录制期间要询问用户是否要停止屏幕共享*/

        /*当用意外点击“取消屏幕共享”，调用stop方法保存视屏文件*/
        stopRecord();
        btnPlay.disabled = false;
        btnDownload.disabled = false;
        btnRecord.disabled = false;
        btnStop.disabled = true;
        //console.log('Stop sharing screen');
    };
    startRecord();
    console.log('gotMediaStream method is running');
    return navigator.mediaDevices.enumerateDevices();
}

//打印错误日志
function handleError(err){
    console.log('getUserMedia error : ', err);
    btnRecord.disabled = false;
    btnStop.disabled = true;
}


function start(){
    videoplay.mute=true;
    if(!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia){
        console.log('getDisplayMedia is not supported');
        return;
    }else{
        // var deviceId = videoSource.value;
        // var audioS = audioSource.value;
        /*这里用来获取用户的媒体流许可，如果成功会返回一个mediaStream对象，这个对象包含一个视频轨道和一个音频轨道*/
        if (audioSource.value=="micphoneaudio") {
            constraints.audio=false;
            navigator.mediaDevices.getDisplayMedia(constraints).then(function(screenStream){
                micAudio(screenStream);
            }).catch(function (err) {
                console.log("getDisplayMedia error: "+err);
                btnPlay.disabled = false;
                btnDownload.disabled = false;
                btnRecord.disabled = false;
                btnStop.disabled = true;
            });
        }else if (audioSource.value=="noaudio"){
            constraints.audio=false;
            navigator.mediaDevices.getDisplayMedia(constraints).then(function(screenStream){
                gotMediaStream(screenStream);
            }).catch(function (err) {
                console.log("getDisplayMedia error: "+err);
                btnPlay.disabled = false;
                btnDownload.disabled = false;
                btnRecord.disabled = false;
                btnStop.disabled = true;
            });
        }else if (audioSource.value == "both"){
            constraints.audio=true;
            navigator.mediaDevices.getDisplayMedia(constraints).then(function(screenStream){
                micAudio(screenStream);
            }).catch(function (err) {
                console.log("getDisplayMedia error: "+err);
                btnPlay.disabled = false;
                btnDownload.disabled = false;
                btnRecord.disabled = false;
                btnStop.disabled = true;
            });
        } else if (audioSource.value=="systemaudio") {
            constraints.audio=true;
            navigator.mediaDevices.getDisplayMedia(constraints).then(function(screenStream){
                gotMediaStream(screenStream);
            }).catch(function (err) {
                console.log("getDisplayMedia error: "+err);
                btnPlay.disabled = false;
                btnDownload.disabled = false;
                btnRecord.disabled = false;
                btnStop.disabled = true;
            }).catch(function (err) {
                console.log("getDisplayMedia error: "+err);
                btnPlay.disabled = false;
                btnDownload.disabled = false;
                btnRecord.disabled = false;
                btnStop.disabled = true;
            });
        }
    }
}

function micAudio(screenStream){
    navigator.mediaDevices.enumerateDevices().then(function(devices){
        devices.forEach(function(device){
            if (device.kind == "audioinput"){
                //统计麦克风数量
                micNumber++;
            }
        });

        if (micNumber == 0){
            //如果没有麦克风
            alert("Can not record your mic phone audio. Please open your mic phone");
            console.log("there is no micPhone on this computer");
            gotMediaStream(screenStream)
        } else {
            //如果有麦克风，用getUserMedia调用麦克风
            navigator.mediaDevices.getUserMedia({audio:true}).then(function(micStream){
                //新建一个MediaStream对象用来存储混合的音频和视屏
                var composedStream = new MediaStream();
                //gotMediaStream(composedStream);
                console.log("composedStream type is: "+composedStream.className);
                //将视屏stream添加到composedStream
                screenStream.getVideoTracks().forEach(function(videoTrack){
                    composedStream.addTrack(videoTrack);
                });

                //如果getDisplayMedia系统音频存在
                if (screenStream.getAudioTracks().length>0){
                    //将系统音频和麦克风音频混合
                    var context = new AudioContext();
                    var audioDestination = context.createMediaStreamDestination();
                    const systemSource = context.createMediaStreamSource(screenStream);
                    //AudioContext.creatGain()用来进行系统图形或声音的增益，可以用来静音
                    const systemGain = context.createGain();

                    systemGain.gain.value = 1.0;
                    systemSource.connect(systemGain).connect(audioDestination);

                    /*如果麦克风开启并且录制了麦克风声音*/
                    if (micStream && micStream.getAudioTracks().length>0){
                        const micSource = context.createMediaStreamSource(micStream);
                        const micGain = context.createGain();
                        micGain.gain.value = 1.0;
                        //现在的audio已经有系统声音了，再把麦克风声音加入
                        micSource.connect(micGain).connect(audioDestination);
                        console.log("added mic audio");
                    }

                    audioDestination.stream.getAudioTracks().forEach(function(audioTrack){
                        //将麦克风和系统声音混合后的音频添加到视屏轨道中
                        composedStream.addTrack(audioTrack);
                    });
                }else {
                    //如果没有系统声音的话，直接将麦克风声音加入
                    micStream.getAudioTracks().forEach(function(micTrack){
                        composedStream.addTrack(micTrack);
                    });
                }
                gotMediaStream(composedStream)
            })
        }
    })
}


//截取快照事件
// snapshort.onclick = function(){
//     picture.className = filtersSelect.value;
//     picture.getContext('2d').drawImage(videoplay, 0,0, picture.width,picture.height);
// };

function handleDataAvailable(e){
    if(e && e.data && e.data.size > 0){
        buffer.push(e.data);
    }
}

function startRecord(){
    buffer = [];
    videoplay.muted=true;
    /**这里要和blob中的设置统一*/
    var options = {mimeType : "video/webm;codecs=H264"};

    if (videoResolution.value=="video/webm;codecs=vp9,opus") {
        options.mimeType="video/webm;codecs=vp9,opus";
    }else if (videoResolution.value=="video/x-matroska;codecs=avc1"){
        options.mimeType="video/x-matroska;codecs=avc1";
    } else if (videoResolution.value=="video/webm;codecs=vp8,opus"){
        options.mimeType="video/webm;codecs=vp8,opus";
    } else if (videoResolution.value=="video/webm;codecs=h264"){
        options.mimeType="video/webm;codecs=h264";
    }

    if(!MediaRecorder.isTypeSupported(options.mimeType)){
        console.error('${options.mimeType} is not supported!');
        return;
    }
    try{
        /*将start整个方法放在这里会报错，因为还没有在选中流媒体的资源的时候就开始创建MediaRecorder了，这时候的window.stream是不能获得到的*/
        if (mixedStream.getVideoTracks().length<0){
            console.log("mixedStream is null");
        }else {
            console.log("mixedStream is not null")
        }
        mediaRecorder = new MediaRecorder(mixedStream, options);
    }catch(e){
        console.error('Failed to create MediaRecorder:',e);
        return
    }
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10);
}

function stopRecord(){
    videoplay.muted=false;
    mediaRecorder.stop();

    /*获得所有媒体流的轨然后停止运行，这样chrome栏在停止的时候就会自动消失*/
    var tracks = mixedStream.getTracks();
    for( var i = 0 ; i < tracks.length ; i++ ) tracks[i].stop();

    mediaRecorder.stream.onended;
}


//录制按钮监听
btnRecord.onclick = ()=>{
    start();
    btnRecord.disabled = true;
    btnRecord.disabled = true;
    btnStop.disabled = false;
    btnPlay.disabled = true;
    btnDownload.disabled = true;
};

//停止录制
btnStop.onclick= ()=>{
    stopRecord();
    btnPlay.disabled = false;
    btnDownload.disabled = false;
    btnRecord.disabled = false;
    btnStop.disabled = true;
};

//播放按钮监听
btnPlay.onclick = ()=>{
    var blob = new Blob(buffer, {type : 'video/webm'});
    videoplay.src = window.URL.createObjectURL(blob);
    videoplay.srcObject = null;
    videoplay.controls = true;
    videoplay.play();
};

//下载按钮监听
btnDownload.onclick = ()=>{
    var blob = new Blob(buffer, {type: 'video/webm'});
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');

    a.href = url;
    a.style.display = 'none';
    a.download = 'aaa.webm';
    a.click();
};
