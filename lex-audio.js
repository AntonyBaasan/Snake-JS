console.log("Hello world!");


// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    // Provide your Pool Id here
    // IdentityPoolId: 'arn:aws:iam::123766920165:policy/AmazonLexRunBotsOnly-201710301541',
    IdentityPoolId: 'us-east-1:0c57599f-0853-4e88-aa08-b161d3ac172d'
});

var lexruntime = new AWS.LexRuntime();
var lexUserId = 'prophix-helper-demo-' + Date.now();
var sessionAttributes = {};

function sendAudioAsDownsampleRight() {
    recorder && recorder.getBuffer(getBufferCallback);
}
function sendAudioAsDownsample() {
    recorder && recorder.getBuffer(function (buffers) {

        var recLength = 0,
        recBuffer = [];
 
        recBuffer.push(buffers[0]);

        // var mergedBuffers = mergeBuffers(recBuffer, recLength);
        var mergedBuffers = recBuffer;
        // Downsample
        var downsampledBuffer = downsampleBuffer(mergedBuffers[0], 16000, audio_context.sampleRate);
        // Encode as a WAV
        var encodedWav = encodeWAV(downsampledBuffer, 16000);                                 
        // Create Blob
        var audioBlob = new Blob([encodedWav], { type: 'application/octet-stream' });

        convertBlobToUrl(audioBlob);

        sendPostContent(audioBlob);

        return false;
    });
}

function encodeWAV(samples, sampleRate) {
    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 32 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);

    return view;
}

function writeString(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function floatTo16BitPCM(output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function getBufferCallback(buffers) {
    var newSource = audio_context.createBufferSource();
    var newBuffer = audio_context.createBuffer(2, buffers[0].length, audio_context.sampleRate);
    newBuffer.getChannelData(0).set(buffers[0]);
    newBuffer.getChannelData(1).set(buffers[1]);
    newSource.buffer = newBuffer;

    newSource.connect(audio_context.destination);
    newSource.start(0);
}


function downsampleBuffer(buffer, rate, sampleRate) {
    if (rate === sampleRate) {
        return buffer;
    }
    var sampleRateRatio = sampleRate / rate;
    var newLength = Math.round(buffer.length / sampleRateRatio);
    var result = new Float32Array(newLength);
    var offsetResult = 0;
    var offsetBuffer = 0;
    while (offsetResult < result.length) {
        var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        var accum = 0,
            count = 0;
        for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }
        result[offsetResult] = accum / count;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
}

function convertFloat32ToInt16(buffer) {
    var l = buffer.length;
    var buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
    }
    return buf.buffer;
}

function sendAudioAsOriginal() {
    recorder && recorder.exportWAV(function (audioBlob) {
        // if there is text to be sent...
        sendPostContent(audioBlob)
        // we always cancel form submission
        return false;
    });
}

function sendPostContent(audioBlob) {
    if (audioBlob) {
        // send it to the Lex runtime
        var params = {
            botAlias: '$LATEST',
            botName: 'Prophix_BotOne',
            // inputText: wisdom,
            inputStream: audioBlob,
            contentType: 'audio/x-l16; sample-rate=' + audio_context.sampleRate + '; channel-count=1', //wav file
            userId: lexUserId,
            sessionAttributes: sessionAttributes,
            accept: "audio/ogg"
        };
        lexruntime.postContent(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                // console.error('Error:  ' + err.message + ' (see console for details)')
            }
            if (data) {
                playAudioResponse(data.audioStream);
                // capture the sessionAttributes for the next cycle
                sessionAttributes = data.sessionAttributes;
                // show response and/or error/dialog status
                console.log(data);
            }
        });
    }

}

function playAudioResponse(audioStream) {
    var uInt8Array = new Uint8Array(audioStream);
    var arrayBuffer = uInt8Array.buffer;
    var blob = new Blob([arrayBuffer]);
    var audioElement = document.createElement('audio');

    var url = URL.createObjectURL(blob);
    audioElement.src = url;
    audioElement.play();
}

function __log(e, data) {
    log.innerHTML += "\n" + e + " " + (data || '');
}

var audio_context;
var recorder;

function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);
    __log('Media stream created.');

    // Uncomment if you want the audio to feedback directly
    //input.connect(audio_context.destination);
    //__log('Input connected to audio context destination.');

    recorder = new Recorder(input, { sampleRate: 16000 });
    __log('Recorder initialised.');
}

function startRecording(button) {
    recorder && recorder.record();
    button.disabled = true;
    button.nextElementSibling.disabled = false;
    __log('Recording...');
}

function stopRecording(button) {
    recorder && recorder.stop();
    button.disabled = true;
    button.previousElementSibling.disabled = false;
    __log('Stopped recording.');

    // create WAV download link using audio data blob
    // createDownloadLink();
    handleAudio()

    recorder.clear();
}

function handleAudio() {
    // createRequestDownloadLink();

    // sendAudioAsOriginal();
    sendAudioAsDownsample();
}

function createRequestDownloadLink() {
    recorder && recorder.exportWAV(function (blob) {
        convertBlobToUrl(blob);
    });
}

function convertBlobToUrl(blob) {
    var url = URL.createObjectURL(blob);
    var li = document.createElement('li');
    var au = document.createElement('audio');
    var hf = document.createElement('a');

    au.controls = true;
    au.src = url;
    hf.href = url;
    hf.download = new Date().toISOString() + '.wav';
    hf.innerHTML = hf.download;
    li.appendChild(au);
    li.appendChild(hf);
    recordingslist.appendChild(li);
}

window.onload = function init() {
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        __log('Audio context set up.');
        __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }

    navigator.getUserMedia({ audio: true }, startUserMedia, function (e) {
        __log('No live audio input: ' + e);
    });
};