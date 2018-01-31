
// 1. Send Audio or Text to the AWS LEX
// 2. Accept response from LEX and calls fulFillmentCallback with Params


function LexDemo(fulFillmentCallback){
    var callBack = fulFillmentCallback;

    this.fulFilled = function(param){
        callBack(param);
    }

    // get response and call this.fulFilled(params)
}