module.exports = async function(req,res,body,params,command,middleValue) {
    console.log(`Location Telegram Function`);
    // We have the start function
    let locSendMessage = `No Location Service Functions yet`;
    if (middleValue.location != undefined) {
        locSendMessage = `Thank you for sending your location\n ${middleValue.location.longitude}\n${middleValue.location.latitude}`;
    }

    const scripting = await program.modules.telegram.script.function.check(program,command,middleValue.chat.id,middleValue,body);
    console.log(scripting);

    return {
        message : locSendMessage,
        response : {
            message : locSendMessage
        }
    }
}