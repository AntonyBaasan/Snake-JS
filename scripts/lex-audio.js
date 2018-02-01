function startRecording(button) {
    recorder && recorder.record();
    button.disabled = true;
    button.nextElementSibling.disabled = false;
    __log('Recording...');
}

function stopRecording(button, callBack) {
    recorder && recorder.stop();
    button.disabled = true;
    button.previousElementSibling.disabled = false;
    __log('Stopped recording.');

    // create WAV download link using audio data blob
    sendAudioAsDownsample(callBack);

    recorder.clear();
}

function sendAudioAsDownsample(callBack) {
    recorder && recorder.getBuffer(function (buffers) {

        var recLength = 0,
            recBuffer = [];

        recBuffer.push(buffers[0]);

        var mergedBuffers = recBuffer;
        // Downsample
        var downsampledBuffer = downsampleBuffer(mergedBuffers[0], 16000, audio_context.sampleRate);
        // Encode as a WAV
        var encodedWav = encodeWAV(downsampledBuffer, 16000);
        // Create Blob
        var audioBlob = new Blob([encodedWav], { type: 'application/octet-stream' });

        convertBlobToUrl(audioBlob);

        sendPostContent(audioBlob, callBack);

        return false;
    });
}

function sendPostContent(audioBlob, callBack) {
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

                showResponse(data, callBack);
            }
        });
    }
}

function playAudioResponse(audioStream) {
    if (audioStream && audioStream.length > 0) {
        var uInt8Array = new Uint8Array(audioStream);
        var arrayBuffer = uInt8Array.buffer;
        var blob = new Blob([arrayBuffer]);

        var audioElement = convertBlobToUrl(blob);
        audioElement.play();
    }
}