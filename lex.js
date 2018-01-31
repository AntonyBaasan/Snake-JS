
// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    // Provide your Pool Id here
    IdentityPoolId: 'us-east-1:0c57599f-0853-4e88-aa08-b161d3ac172d' // BotPool
});

var lexruntime = new AWS.LexRuntime();
var lexUserId = 'prophix-helper-demo-' + Date.now();
var sessionAttributes = {
    "UserName": "Antony",
    "ModuleName": "Process Manager"
};

function pushChat(callBack) {
    // if there is text to be sent...
    var wisdomText = document.getElementById('wisdom');
    if (wisdomText && wisdomText.value && wisdomText.value.trim().length > 0) {

        // disable input to show we're sending it
        var wisdom = wisdomText.value.trim();
        wisdomText.value = '...';
        wisdomText.locked = true;

        // send it to the Lex runtime
        var params = {
            botAlias: '$LATEST',
            botName: 'Prophix_BotOne',
            inputText: wisdom,
            userId: lexUserId,
            sessionAttributes: sessionAttributes,
        };

        showRequest(wisdom);

        lexruntime.postText(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                showError('Error:  ' + err.message + ' (see console for details)')
            }
            if (data) {
                // capture the sessionAttributes for the next cycle
                sessionAttributes = data.sessionAttributes;
                // show response and/or error/dialog status
                showResponse(data, callBack);
            }
            // re-enable input
            wisdomText.value = '';
            wisdomText.locked = false;
        });
    }
    // we always cancel form submission
    return false;
}

function showRequest(daText) {
    appendText(daText, 'userRequest');
}

function showError(daText) {
    appendText(daText, 'lexError');
}

function appendText(daText, className) {
    var conversationDiv = document.getElementById('conversation');
    var requestPara = document.createElement("P");
    requestPara.className = className;
    requestPara.appendChild(document.createTextNode(daText));
    conversationDiv.appendChild(requestPara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
}

function showResponse(lexResponse, callBack) {
    console.log(lexResponse);
    var conversationDiv = document.getElementById('conversation');
    var responsePara = document.createElement("P");
    responsePara.className = 'lexResponse';
    if (lexResponse.message) {
        responsePara.appendChild(document.createTextNode(lexResponse.message));
        responsePara.appendChild(document.createElement('br'));
    }
    if (lexResponse.dialogState === 'ReadyForFulfillment') {
        responsePara.appendChild(document.createTextNode('Ready for fulfillment'));
        callBack(lexResponse);
    } else {
        responsePara.appendChild(document.createTextNode(
            '(' + lexResponse.dialogState + ')'));
    }
    conversationDiv.appendChild(responsePara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
}