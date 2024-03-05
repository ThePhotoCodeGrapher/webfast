module.exports = async function(program,json) {
    console.log(`Pocess Startup`);
    // Process startup for mollie
    if (!json.active) {
        return false;
    }

    if (json.url[json.url.length-1] == `/`) {
        json.url = json.url.slice(0, -1)
    }

    // When active startup process by indexing functions
    const functionPath = program.path.join(json.path,`functions`);
    console.log(`Function Path`);
    let restArray = {
        create : await require(program.path.join(__dirname,`create.js`))(program,json),
        get : async function(url,params) {
            console.log(`GET`);

            // Process params for url
            let count = 0;
            for (let param in params) {
                console.log(`Param ${param}`);
                if (count == 0) {
                    url += `?`;
                } else {
                    url += `&`
                }
                url += `${param}=${params[param]}`;
                count++;
            }

            const data = await program.modules.request.get(program, url, undefined, {
                'Authorization': `Bearer ${json.key}`
            })

            return data;
        },
        post : async function(program,url,body,headers) {
            console.log(`POST`);
            
            const requestPOST = await program.modules.request.post(program,url,body,headers);
            return requestPOST;
        }
    }

    // Start sync
    //https://api.frankfurter.app/latest?to=EUR%2CUSD
    restArray.currencySync = async function() {
        const data = await program.modules.request.get(program, `https://api.frankfurter.app/latest`);
        // process
        console.log(`Process Data`);
        data.ts = Date.now();
        program.tmp.currency = data;
    }
    restArray.int = setInterval(function(){
        console.log(`Set INterval`);
        restArray.currencySync();
        console.log(Date.now(),program.tmp.currency);
    },14 * 60 * 1000)
    
    // Sync Onces
    await restArray.currencySync();

    // In init we want to do the get request
    const getURL = `${json.url}/v2/methods/all`
    const requestUSD = await restArray.get(getURL,{
        locale : "en_US",
        'amount[value]'  :  "100.00",
        'amount[currency]'  :  "USD",
        "include"       :   "pricing"
    })

    const requestEU = await restArray.get(getURL,{
        locale : "en_US",
        'amount[value]'  :  "100.00",
        'amount[currency]'  :  "EUR",
        "include"       :   "pricing"
    })

    // Process both
    // Check who bigger then other
    let mainLoop;
    let subLoop;
    if (requestEU.count > requestUSD.count) {
        mainLoop = requestEU._embedded.methods;
        subLoop = requestUSD._embedded.methods;
    } else {
        mainLoop = requestUSD._embedded.methods;
        subLoop = requestEU._embedded.methods;
    }

    // Make paymentArray 
    let payar = {}

    // Set to arrays
    // Loop Through main
    const loopthrough = [mainLoop,subLoop];
    for (let l in loopthrough) {
        let currentLoop = loopthrough[l];
        for (let nm in currentLoop) {
            const itemData = currentLoop[nm];

            // Set data
            if (itemData.status == undefined) {
                continue;
            }
            if (payar[itemData.id] == undefined) {
                payar[itemData.id] = {
                    desc : itemData.description,
                    status : itemData.status,
                    res : itemData.resource,
                    images : itemData.image,
                    currency : {},
                    pricing : {
                        items : itemData.pricing
                    }
                }
            }

            // Now loop through pricing to see max and min
            let allPricing = [];

            let maxPers = 0;
            let minPers = 0;
            let maxFix = 0;
            let minFix = 0;
            let pricingCurrency = [];
            for (let prI in itemData.pricing) {
                // get item
                const pricing = itemData.pricing[prI];

                let setPricing = {};

                for (let key in pricing) {
                    switch (key) {
                        case `variable`:
                            const thePerc = Number(pricing[key]);
                            if (thePerc > maxPers) {
                                maxPers = thePerc;
                            }
                            if (thePerc < minPers || minPers == 0) {
                                minPers = thePerc;
                            }
                            setPricing.percentage = thePerc;
                        break;
                        case `fixed`:
                            const fixPrice = Number(pricing[key].value);
                            // Set fix price
                            if (fixPrice > maxFix) {
                                maxFix = fixPrice;
                            }
                            if (fixPrice < minFix || minFix == 0) {
                                minFix = fixPrice;
                            }
                            pricing[key].value = Number(pricing[key].value);
                            setPricing[key] = pricing[key];

                            // check if in array
                            if (pricingCurrency.indexOf(pricing[key].currency) == -1) {
                                pricingCurrency.push(pricing[key].currency)
                            }
                        break;
                        default:
                            console.log(`Set Just: ${key}`);
                            setPricing[key] = pricing[key];
                    }
                }
                allPricing.push(setPricing);
            }
            console.log(`We have all pricing per item now`);
            itemData.pricing = {
                all : allPricing,
                perc : {
                    min : minPers,
                    max : maxPers
                },
                fix : {
                    min : minFix,
                    max : maxFix
                },
                currencies : pricingCurrency
            }
            payar[itemData.id].pricing = itemData.pricing;

            // Now grab currency
            const currency = {
                max : itemData.maximumAmount.value,
                min : itemData.minimumAmount.value
            };

            if (payar[itemData.id].currency[itemData.minimumAmount.currency] == undefined) {
                payar[itemData.id].currency[itemData.minimumAmount.currency] = currency;
            } else {
                console.error(`Currency already set`);
            }
        }
    }

    restArray.methods = payar;

    // Create dynamic app get for receiving data
    const fullPath = `${process.env.url.slice(0,-1)}/webhooks/orders/:orderId/:action`;
    // setup dynamic routing
    restArray.webhookURL = fullPath;
    async function functionRequest(req,res,type) {
        const orderId = req.params.orderId;
        const action = req.params.action;
        console.log(`Received data for payment`,type);

        // Get body Data
        const body = req.body;

        // First grab order
        let pipeline = [
            {
                $match: {
                uuid: orderId
                }
            }
        ];

        let payment = await program.modules.data.aggregate(program,process.env.dbName, 'payment', pipeline);
        if (payment.length == 0) {
            res.status(500);
            res.send(`FALSE`);
        } else {
            payment = payment[0];
        }

        console.log(`We have payment data`);

        // Check if cancel
        let order = await program.modules.data.aggregate(program,process.env.dbName, 'order', [
            {
                $match: {
                uuid: payment.order
                }
            }
        ]);
        order = order[0];

        // We have order add action to state
        const typeOf = typeof order.state;
        if (typeOf != `object`) {
            order.state = [];
        }
        order.state[action] = Date.now();


        // Get id
        if (type == `post`) {
            const paymentID = body.id;

            // Now check payment
            const getURL = `${json.url}/v2/payments/${paymentID}`
            const validate = await restArray.get(getURL);

            // Okay we have new data
            const status = validate.status;

            order.state[status] = Date.now();

            console.log(`To Validate Payment`);

            // Add completed to state if finished
            if (status == `paid`) {
                const paidDate = new Date(validate.paidAt);
                const unixTimestamp = Math.floor(paidDate.getTime() / 1000);
                order.state[`completed`] = unixTimestamp;

                // Update 
                const updatedFinal =await program.modules.data.update(process.env.dbName,`order`,{
                    uuid : orderId
                },{
                    $set: {
                        payed : unixTimestamp,
                        paymentDetails : validate.details,
                        countryCode : validate.countryCode,
                        mode : validate.mode,
                        state : true,
                        paid : Date.now()
                    }
                });

                validate.package = payment.package;
                validate.order = payment.order;
                validate.uuid = payment.uuid;
                validate.user = payment.user;

                const paymentFinale =await program.modules.data.update(process.env.dbName,`payment`,{
                    uuid : payment.uuid
                },{
                    $set: validate
                });

                console.log(`Final Update`,updatedFinal,paymentFinale);

                // Check also for message now
                // Grab message
                try {
                    const lastMessageId = order.messages[0];
                    let messageData = await program.modules.data.aggregate(program,process.env.dbName, 'send', [{$match: {uuid: lastMessageId}}]);
                    if (messageData.length == 0) {
                        // No message send
                        console.error(`No Message Send`);
                    } else {
                        messageData = messageData[0];
                    }

                    const packageID = order.package;
                    
                    let packageLine = [{$match: {uuid:packageID}},{$project: {name: 1,description: 1, price:1}}];
                    let packageData = await program.modules.data.aggregate(program,process.env.dbName, 'pricing', packageLine);
            
                    // Okay we have message data
                    const orderURL = `${process.env.webURL.slice(0,-1)}/concepts/esimco/order#${order.uuid}__redirect`;
                    const howToURL = `${process.env.webURL.slice(0,-1)}/concepts/esimco/order#${order.uuid}__how-to`;
                    const referralURL = `${process.env.webURL.slice(0,-1)}/concepts/esimco/order#${order.uuid}__referral`;
        
                    const textMessage = `<b>✅ Your payment is received!</b>\n<span class="tg-spoiler">Order ID: <b>${order.uuid}</b></span>\n\nWe are now matching your order and payment. You will receive your ordered prodcut in a few minutes: <b>${String(packageData[0].description).toUpperCase()}</b>`
                    try {
                        let telegramSend = await program.modules.telegram.functions.send(program,textMessage,order.user,[
                            [
                                { text: 'View Order',  web_app : { url : orderURL}},
                                { text: 'How to?',  web_app : { url : howToURL}},
                                { text: 'Referral',  web_app : { url : referralURL}}
                            ]
                        ],messageData.message_id);

                        console.log(`Sending telegram`);

                        // Update order messages
                        
                    } catch(err) {
                        console.error(err);
                        console.error(`Error updating message`);
                    }

                } catch (err) {
                    console.error(err);
                    console.error(`Something with message`);
                }
            }
        }


        const updated =await program.modules.data.update(process.env.dbName,`order`,{
            uuid : order.uuid
        },{
            $set: {
                state : order.state
            }
        });

        // Updated state in order
        // Now redirect doesn't matter in what
        const fullPath = `${process.env.webURL.slice(0,-1)}/concepts/esimco/order#${order.uuid}__redirect`;
        if (type == `post`) {
            res.send(`OK`);
            res.status(200);
        } else if (action == `page-redirect` || action == `bot-redirect`) {
            res.redirect(payment._links.checkout.href)
        } else {
            res.redirect(fullPath);   
        }
    }
    program.express.app.get(`/webhooks/orders/:orderId/:action`, async function(req,res){
        return await functionRequest(req,res,`get`);
    })
    program.express.app.post(`/webhooks/orders/:orderId/:action`, async function(req,res){
        return await functionRequest(req,res,`post`);
    })
    return restArray;
}