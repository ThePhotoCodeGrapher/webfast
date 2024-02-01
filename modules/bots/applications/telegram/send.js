module.exports = async function(program,message,id,buttons) {
    console.log(`Telegram Send`);
    // Create Request for send
    let telegramURL = `https://api.telegram.org/bot${process.env.telegram}`;

    // Check if buttons is send as []
    let options;
    if (buttons != undefined) {
        console.log(`Loop Through Buttons`);
        const keyboard = {
            inline_keyboard: buttons,
    
            resize_keyboard: true,
            one_time_keyboard: true
        };
        
        options = {
            reply_markup: JSON.stringify(keyboard)
        };
    }


    const body = {
        text: message,
        disable_web_page_preview: false,
        disable_notification: false,
        reply_to_message_id: null,
        chat_id : id,
        parse_mode : 'HTML'
    }

    // Check if object
    if (typeof message == `object`) {
        if (message.text != undefined && message.image == undefined) {
            body.text = message.text;
            telegramURL = `${telegramURL}/sendMessage`;
        } 

        // Check for image
        if (message.image != undefined) {
            body.photo = message.image;
            body.caption = message.text;
            delete body.text;
            delete body.reply_to_message_id;
            telegramURL = `${telegramURL}/sendPhoto`;
        }
    } else {
        telegramURL = `${telegramURL}/sendMessage`;
    }

    // If options is there add as
    if (options != undefined) {
        body.reply_markup = options.reply_markup;
    }

    const madeRequest = await program.modules.request.post(program,telegramURL,body)

    // Save to send so we can have the id and do things
    madeRequest.result.uuid = program.uuid.v4();
    let saveSend = await program.modules.data.findOrCreate(`eventgo`,`send`,{
        message_id : madeRequest.result.message_id
    },madeRequest.result);

    console.log(`Send Message`);
    return madeRequest;
}