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
                        middleValue.chat.ts = Date.now();
                        middleValue.chat.uuid = program.uuid.v4();
                        let user = await program.modules.data.findOrCreate(`eventgo`,`telegram`,{
                            id : middleValue.chat.id
                        },middleValue.chat);
                        let typeOFF = typeof user;
                        if (middleValue.chat.uuid == user.uuid) {
                            user.new = true;
                        }
                        
                        middleValue.chat.uuid = user.uuid;

                        // Find or create to add message to db
                        body.uuid = program.uuid.v4();
                        let received = await program.modules.data.findOrCreate(`eventgo`,`received`,{
                            update_id : body.update_id
                        },body);
                        
                        // Set body from receivd
                        body.uuid = received.uuid;
                        

                        console.log(`We have received message`,received);

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
                                // Define the regex pattern to extract information
                                // Let's split up
                                let match = [];

                                if (variables != undefined) {
                                    let splitVariables = variables.split(`-`);

                                    if (splitVariables.length > 4) {
                                        match[0] = splitVariables[0];
                                        if (splitVariables.length >= 5) {
                                            match[1] = splitVariables[splitVariables.length-1];
                                            let uuid = variables.replace(`${match[0]}-`,``).replace(`-${match[1]}`,``);;
                                            match[2] = uuid;
                                        }
                                    }
                                }
                                
                                if (match.length > 0) {
                                    // Extract the parts
                                    const action = match[0];
                                    const uuid = match[2];
                                    const subFunction = match[1];

                                    console.log('Action:', action);
                                    console.log('UUID:', uuid);
                                    console.log('Sub-Function:', subFunction);

                                    // It's something to do check if we can find this in applications
                                    try {
                                        console.log(`Run Sub Function`);
                                        let resp = await program.modules.telegram.functions[action](program,key,action,uuid,subFunction,middleValue,received);

                                        // Switch resp;
                                        console.log(`Check if we send message`);
                                        switch (resp.response) {
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
                                        console.error(`Error Sub Function ${key}, ${action}`);
                                    }

                                } else {
                                    console.log('String does not match the expected pattern.');
                                    // So run the function
                                    try {
                                        // Run dynamic the type of middleware
                                        const runFunc   =   await program.modules.telegram.middleware[key][command](req,res,body,params,command,middleValue,received);
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
                                    console.log(`Checking for script`);
                                    const scripting = await program.modules.telegram.script.function.check(program,command,middleValue.chat.id,middleValue,received);
                                    /*
                                    await program.modules.telegram.functions.send(program,`${command}`,middleValue.chat.id,[
                                        [
                                            { text: 'EventGO!',  web_app : { url : 'https://cloud.eventgo.today/events/list'}},
                                            { text: 'Create Event', callback_data: 'create_event' },
                                        ]
                                    ]);*/
                                    console.log(scripting);
                                }

                                
                                res.send(`OK`);
                                res.status(200);
                            }
                        } catch (message) {
                            // Process as other
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

                            console.log(`We do something here`);

                            res.send(`OK `)
                            res.status(200);
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
            const pathSync = await program.fs.statSync(module.path);
            const isDirectoryPath = await pathSync.isDirectory();
            const fileExtension = program.path.extname(module.path);

            // Check if directory
            if (isDirectoryPath) {
                // It's directory so don't do anything yet
                console.log(`It's Directory fo something`);
            } else {
                telegram.functions[key] = require(module.path);
                console.log(`Having The Module`,module);
            }
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

    // Process scripts
    const scriptsPath   =   program.path.join(__dirname,`telegram`,`scripts`);

    // Loop Through scripts folder
    let scriptsData = await program.modules.walkDirectory(scriptsPath);

    // Let's loop througha and if no extension it's folder
    let allScripts = {
        int : {}
    }
    for (let scriptIndex in scriptsData) {
        let script = scriptsData[scriptIndex];
        // We now have the specific script check if folder
        if (!script.extension) {
            // It's folder create the function and read folder
            console.log(`It's folder check for files as in .json or .js`);
            const folderScriptScan = await program.modules.walkDirectory(script.path);

            // Create now allScripts item interaction as we will check dynamic for the item
            for (let fsi in folderScriptScan) {
                // So now again we only do things when it's a file but check  extension
                const scriptItem = folderScriptScan[fsi];
                // We have folder data
                if (!scriptItem.extension) {
                    continue;
                }

                // We have script create 
                console.log(`Folder Script Scan`,scriptItem);

                // Switch extension
                const extCheck = scriptItem.extension.slice(1);

                // We have the extension so swich between those
                switch (extCheck){
                    case `json`:
                        console.log(`Read File`);
                        try {
                            const readFile = JSON.parse(await program.fs.readFileSync(scriptItem.path,`utf-8`));

                            // Create the command
                            const interact = readFile.input;

                            // For interaction
                            delete readFile.input;
                            allScripts.int[interact] = readFile;
                            
                            console.log(`We have readed the file`);
                        } catch (err) {
                            console.error(err);
                            console.error(`Error Reading JSON file`);
                        }
                    break;
                    default:
                        // When it's not like json
                        console.log(`it's something else`);
                }
            }

            console.log(`Walk Through folder and check for script.json`);

        } else {
            // It's main script functions
            console.log(`Main Script Function In Specific folder`);
            try {
                // Add script to allscript
                allScripts[script.name] =   require(script.path);
                console.log(`Script : ${script.name} - loaded`);
            } catch (err) {
                console.error(err);
                console.error(`Error Loading script`,script);
            }
        }
    }

    // Set all script
    telegram.script = allScripts;

    program.modules.telegram = telegram;
    return program;
}