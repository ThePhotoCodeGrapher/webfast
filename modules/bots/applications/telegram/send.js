module.exports = async function(program,message,id) {
    console.log(`Telegram Send`);
    // Create Request for send
    const telegramURL = `https://api.telegram.org/bot${process.env.telegram}/sendMessage`;

    const body = {
        text: message,
        disable_web_page_preview: false,
        disable_notification: false,
        reply_to_message_id: null,
        chat_id : id,
        parse_mode : 'HTML'
    }

    const madeRequest = await program.modules.request.post(program,telegramURL,body)
    console.log(`Send Message`);
    return madeRequest;
}