module.exports = async function(program,json) {
    console.log(`Init Create with json data`);
    return async function(program,order,payment,price,currency) {
        console.log(`Create Payment`);
        //const price = Number(order.price).toFixed(2);
        // Get order info data
        let pipeline = [
            {
              $match: {
                uuid: order.package
              }
            }
        ];
        let package = await program.modules.data.aggregate(program,process.env.dbName, 'pricing', pipeline);
        if (package.length == 0) {
            throw new Error(`No Package found for payment`);
        } else {
            package = package[0];
        }

        // create redirect url
        let webhookURL = program.modules.payment.mollie.webhookURL;
        // create new payment uuid
        const paymentUUID = program.uuid.v4();
        
        const redirectURL = webhookURL.replace(`:orderId`,paymentUUID).replace(`:action`,`redirect`);
        const cancelURL = webhookURL.replace(`:orderId`,paymentUUID).replace(`:action`,`cancel`);
        const pageRedirect = webhookURL.replace(`:orderId`,paymentUUID).replace(`:action`,`page-redirect`);
        webhookURL =  webhookURL.replace(`:orderId`,paymentUUID).replace(`:action`,`update`);

        const paramsArray = {
            amount : {
                currency : String(currency).toUpperCase(),
                value : String(Number(price/100).toFixed(2))
            },
            description  :  `eSimCo. ${package.name.toUpperCase()}`,
            redirectUrl : redirectURL,
            cancelUrl : cancelURL,
            webhookUrl : webhookURL,
            locale : 'en_US',
            method : payment.provider
        }

        // We have now method etc. let's build up the call
        const getURL = `${json.url}/v2/payments`
        const request = await program.modules.payment.mollie.post(program,getURL,paramsArray,{
            'Authorization': `Bearer ${json.key}`,
            'content-type': 'application/json'
        })

        // WE made request
        request.uuid = paymentUUID;
        request.package = order.package;
        request.user = order.user;
        request.order = order.uuid;

        // Now save to request DB
        const create = await program.modules.data.insert(process.env.dbName,`payment`,request);

        // Now upate
        let newState = order.state;
        newState[`waiting`] = Date.now();

        console.log(`Updated`);

        console.log(`Made Request`,request);
        
        // Now send response
        let redirect = {
            type : true,
            url : request._links.checkout.href,
            requestID : program.uuid.v4(),
            full : true
        }

        // Check url
        redirect.url = pageRedirect;

        // Send Payment info per bot and link for order
        console.log(`Send Payment info link per bot`);
        // create payment url 
        const orderURL = `${process.env.webURL.slice(0,-1)}/concepts/esimco/order#${request.order}__redirect`;
        // create order url redirect url
        const paymentRedirect = `${process.env.url.slice(0,-1)}/webhooks/orders/${request.uuid}/bot-redirect`;

        // Create message
        let payIcon = `!`;
        if (request.amount.currency.toUpperCase() == `USD`) {
            payIcon = `$`;
        }
        if (request.amount.currency.toUpperCase() == `EUR`) {
            payIcon = `€`;
        }
        const textMessage = `<b>⚠️ Your order is created but unpaid!</b>\n<span class="tg-spoiler">Order ID: <b>${request.order}</b></span>\n\nTo receive your order we would like to ask you to fullfill the payment for the remaining amount of <span class="tg-spoiler"><b>${payIcon} ${request.amount.value}</b></span>.\n\nClick on <u>Pay Now</u> to fullfill your payment or click <u>view order</u> to view your order.`
        try {
            let telegramSend = await program.modules.telegram.functions.send(program,textMessage,request.user,[
                [
                    //{ text: 'View Order',  web_app : { url : orderURL}},
                    { text: 'Pay Order',  web_app : { url : paymentRedirect}}
                ]
            ]);

            // Now we have message id set that to the order

            // Add update to message order thingy
            let setArray = {
                state : newState,
                payment : paymentUUID,
                messages : [telegramSend.result.uuid]
            }
            setArray.ref = order.ref;

            order.state.payReqCreated = Date.now();
            const updated =await program.modules.data.update(process.env.dbName,`order`,{
                uuid : order.uuid
            },{
                $set: setArray
            });
            console.log(`Telegram Send`);
        } catch (err) {
            console.error(err);
            console.error(`Error with sending to client`);
        }


        const sendArray =  {
            func : `redirect`,
            data : {
                event : redirect
            },
            js : `delete web.fast.tmp.sending;`
        };
        return sendArray;
    }
}