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
            // set in collection telegram 
            // Process
            let updateID;
            
            for (let key in body) {
                // Get Keys
                if (key == `update_id`) {
                    updateID = body[key];
                } else {
                    // /Try to find if this middleware is there
                    try {
                        // Try To Load it
                        let middleValue = body[key];
                        // Check for split
                        // Try for message
                        try {
                            if (middleValue.text.startsWith('/')) {
                                // If it starts with a slash, it might be a command
                                const parts = middleValue.text.split(' ');
                                
                                // The first part (index 0) will be the command, and the rest are potential variables
                                const command = parts[0].slice(1);
                                const variables = parts.slice(1)[0];

                                console.log('Command:', command);
                                console.log('Variables:', variables);
                                // Define a regular expression pattern to match the different parts
                                const regexPattern = /^([a-z]+)-([0-9a-f\-]+)-([a-z]+)$/;

                                // Use the regular expression to match the parts
                                let match;
                                if (variables != undefined) {
                                    match = variables.match(regexPattern);
                                }
                                
                                if (match) {
                                    // Extract the parts
                                    const action = match[3];
                                    const uuid = match[2];
                                    const subFunction = match[1];

                                    console.log('Action:', action);
                                    console.log('UUID:', uuid);
                                    console.log('Sub-Function:', subFunction);

                                    // It's something to do check if we can find this in applications
                                    

                                } else {
                                    console.log('String does not match the expected pattern.');
                                    // So run the function
                                    try {
                                        // Run dynamic the type of middleware
                                        const runFunc   =   await program.modules.telegram.middleware[key][command](req,res,body,params,command,middleValue);
                                        const respFunc = runFunc.response;
                                        // PRocess response for object
                                        const action = Object.keys(respFunc)[0];
                                        
                                        // switch action
                                        switch (action) {
                                            case `message`:
                                                console.log(`We have response, check for response message`);
                                                const message = respFunc[action];
                                                await program.modules.telegram.functions.send(program,message,middleValue.chat.id);
                                            break;
                                            default:
                                                console.error(`Missing Response Action Telegram: ${action}`);
                                        }
                                    } catch (err) {
                                        //console.error(err);
                                        //console.error(`Error For Telegram Function`);
                                        await program.modules.telegram.functions.send(program,`Unknown Command: ${command}`,middleValue.chat.id);
                                    }
                                }

                                // Now you can handle the command and its associated variables as needed
                                res.send(`OK | ${command} | ${variables}`)
                                res.status(200);
                            } else {
                                // If it doesn't start with a slash, it might be something else
                                //console.error('Not a command:', middleValue);
                                
                                // TODO Catch events for middleware now just respond
                                const message = `${middleValue.text}`;
                                const command = message;
                                try {
                                    // Run dynamic the type of middleware
                                    const runFunc   =   await program.modules.telegram.middleware[key][command](req,res,body,params,command,middleValue);
                                    const respFunc = runFunc.response;
                                    // PRocess response for object
                                    const action = Object.keys(respFunc)[0];
                                    
                                    // switch action
                                    switch (action) {
                                        case `message`:
                                            console.log(`We have response, check for response message`);
                                            const message = respFunc[action];
                                            await program.modules.telegram.functions.send(program,message,middleValue.chat.id);
                                        break;
                                        default:
                                            console.error(`Missing Response Action Telegram: ${action}`);
                                    }
                                } catch (err) {
                                    //console.error(err);
                                    //console.error(`Error For Telegram Function`);
                                    await program.modules.telegram.functions.send(program,`${command}`,middleValue.chat.id);
                                }

                                
                                res.send(`OK`);
                                res.status(200);
                            }
                        } catch (message) {
                            // Process as other
                            res.send(`OK | ${command} | ${variables}`)
                            res.status(200);
                            console.log(`Process Different`);
                            let checkArray = [`location`];
                            // Loop through checkArray
                            for (let c in checkArray) {
                                const command = checkArray[c];
                                const indexCheck = Object.keys(middleValue).indexOf(command);
                                if (indexCheck != -1) {
                                    console.log(`Run this as middleware`);
                                    try {
                                        const runFunc   =   await program.modules.telegram.middleware[key][command](req,res,body,params,command,middleValue);
                                        const respFunc = runFunc;
                                        // PRocess response for object
                                        if (respFunc == undefined) {
                                            continue;
                                        }
                                        let action = Object.keys(respFunc)[0];
                                        
                                        console.log(`The Action`);
                                        switch (action) {
                                            case `message`:
                                                console.log(`We have response, check for response message`);
                                                const message = respFunc[action];
                                                await program.modules.telegram.functions.send(program,message,middleValue.chat.id);
                                            break;
                                            default:
                                                console.error(`Missing Response Action Telegram: ${action}`);
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        console.error(`Missing Function For Middleware`,middleware);

                                        // Send error
                                        res.send(`ERROR-2395343`);
                                        res.status(500);
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error(err);
                        console.error(`Error with loading message`);
                        res.status(`ERROR-235235`);
                        res.status(500);
                    }
                }
            }
            /*
            let create = await program.modules.data.findOrCreate(`eventgo`,`telegram`,{
                tID : 
            })
            res.send(`OK | POST`);
            return;
            */
        });

    } catch(err) {
        console.error(err);
        console.error(`Error Setting URL`);
    }

    const teleData = program.path.join(__dirname,`telegram`);
    let moduleData = await program.modules.walkDirectory(teleData);
    // Loop Through
    let telegram = {
        functions : {}
    };
    for (let index in moduleData) {
        // Lets go
        let module = moduleData[index];
        let key = module.name;

        // Try to load it
        try {
            telegram.functions[key] = require(module.path);
            console.log(`Having The Module`,module);
        } catch (err) {
            console.error(err);
            console.error(`Error Setting Up Telegram Module`);
        }
    }

    let middleWareFolder = program.path.join(__dirname,`telegram`,`middleware`);
    console.log(`MiddleWare:`,middleWareFolder);

    let middleWareData = program.fs.readdirSync(middleWareFolder);
    
    // Loop Through Middleware
    let middleWarFuncs = {};
    for (let mi in middleWareData) {
        // Then loop through middlewarefolder for types
        const middleWareName = middleWareData[mi];
        let middleWareLoopFolder = program.path.join(middleWareFolder,middleWareName)
        try {
            let middleWareDataFolderLoop = program.fs.readdirSync(middleWareLoopFolder);
            middleWarFuncs[middleWareName] = {};
            for (let miN in middleWareDataFolderLoop) {
                // Then loop through middlewarefolder for types
                const fileName = middleWareDataFolderLoop[miN];
                let middleWareLoopFolderSub = program.path.join(middleWareLoopFolder,fileName);
                try {
                    const requireFunc = require(middleWareLoopFolderSub);
                    middleWarFuncs[middleWareName][fileName.split(`.`)[0]] = requireFunc;
                    console.log(`Setted Middleware`);
                } catch (err) {
                    console.error(err);
                    console.error(`Error Looping Message`);
                }
                
            }
        } catch (err) {
            console.error(err);
            console.error(`Error Middle ware Telegram`);
        }
    }

    // Add middleware
    telegram.middleware = middleWarFuncs;

    program.modules.telegram = telegram;
    return program;
}