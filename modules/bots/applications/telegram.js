module.exports = async function(program,folder) {
    console.log(`telegram application`);
    const token = process.env.telegram;

    // Create Adaptive URL
    const adaptiveURL = `/api/${program.uuid.v4()}/telegram/hook`;

    // Create request
    const webhookURL = `${process.env.url}${adaptiveURL.slice(1)}`;

    const telegramURL = `https://api.telegram.org/bot${token}/setWebhook`;

    try {
        const madeRequest = await program.modules.request.post(program,telegramURL,{
            url : webhookURL
        })

        console.log(`Setup Telegram`,madeRequest);

        // Set adaptive url get
        program.express.url.set(adaptiveURL,`get`,async function(req,res,body,params){
            console.log(`We have adaptive url get`);
            res.send(`OK | GET`);
            return true;
        })

        // Set adaptive url post
        program.express.url.set(adaptiveURL,`post`,async function(req,res,body,params){
            console.log(`We have adaptive url post`);
            res.send(`OK | POST`);
            return;
        })
    } catch(err) {
        console.error(err);
        console.error(`Error Setting URL`);
    }


    return true;
}