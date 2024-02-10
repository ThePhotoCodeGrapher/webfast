// Here we can collect something by when user enter collect state in telegram
module.exports = {
    line : {},
    set : function(id,data) {
        // To set que
        console.log(`Que Set Telegram`);
        this.line[id] = data;
        return this.line[id];
    },
    get : function(id,program) {
        console.log(`Que Get Telegram`);
        // Check if in que line
        if (program.modules.telegram.functions.que.line[id] == undefined) {
            return false;
        } else {
            let lineData = program.modules.telegram.functions.que.line[id];
            return lineData;
        }
    },
    timer : function() {
        // Run timer
        console.log(`Timer Run To See if we need to send a message or not`);
    },
    run : async function(program,command,chatID,middleValue,data) {
        // Run timer
        console.log(`run que data to give back response`);

        // Check if que
        try {

            let scriptStart = `start`;
            // It's new
            if (program.modules.telegram.script.int[command] == undefined && program.modules.telegram.functions.que.line[chatID] == undefined) {
                // Send message we don't know
                
                return false;
            } 

            // Create the que line command
            let script = program.modules.telegram.script.int[command];

            let current;

            let theUUID = program.uuid.v4();
            
            if (program.modules.telegram.functions.que.line[chatID] != undefined && middleValue.origin != undefined) {
                if (middleValue.origin.startsWith(`/`)) {
                    delete program.modules.telegram.functions.que.line[chatID];
                }
            }

            if (program.modules.telegram.functions.que.line[chatID] != undefined) {
                // It's original que
                // Process response
                console.log(`It's a process`)
                current = program.modules.telegram.functions.que.line[chatID];
                theUUID = current.uuid;

                // Check what to do next first of all save anwser
                const question = current.script[current.process];
                // Grab function to process
                const anwser = middleValue;

                // Check if text then we need to match if not we probably need to run only function and go to next one
                let matched = false;
                let anwserData;
                if (middleValue.text != undefined) {
                    console.log(`Match Text`);
                    // Loop through match
                    anwserData = middleValue.text;
                    for (let q in question.match.data) {
                        const qMatch = question.match.data[q];

                        // Check typeof
                        if (typeof qMatch.anwser == `object`) {
                            // Match in index
                            try {
                                const matchedIndex = qMatch.anwser.indexOf(middleValue.text);
                                if (matchedIndex != -1) {
                                    matched = qMatch;
                                }
                            } catch (err){
                                if (middleValue.text == `stop` || middleValue.text == `reset`) {
                                    delete program.modules.telegram.functions.que.line[chatID];
                                }
                            }
                        } else if (qMatch.anwser == middleValue.text) {
                            matched = qMatch;
                        }
                    }
                } else {
                    // Check if something with type: 
                    for (let li in question.match.data) {
                        let matchCheck = question.match.data[li];
                        if (typeof matchCheck.anwser == `object`) {
                            // Grab type if it's there
                            switch (matchCheck.anwser.type) {
                                case command:
                                    console.log(`It's the dynamic thing`);
                                    matched = matchCheck;
                                    let variable;
                                    if (data.message != undefined) {
                                        variable = data.message[command]
                                    } else if (data.callback_query != undefined) {
                                        variable = data.callback_query
                                    }

                                    anwserData = {
                                        type : command,
                                        data : variable
                                    };
                                break;
                                default:
                                    console.log(`No matching type found`);
                            }
                        }
                    }

                }

                // End of match process fo matched checking
                if (matched == false && current.q == true) {
                    // We have different data
                    console.error(`Not matched`);
                    // Send command when wrong // or buttons like reset button
                    // check what to do
                    // check if stop
                    if (String(middleValue.text) == `reset` || String(middleValue.text) == `stop`) {
                        delete program.modules.telegram.functions.que.line[chatID];
                    }
                    return false;
                } else {
                    console.log(`Matched`);
                    current.anwsers[current.process] = {
                        anwser : anwserData,
                        message : anwser,
                        ts : Date.now()
                    };

                    // Set next steps and get next steps data
                    try {
                        const nextData = current.script[matched.next];
                        if (nextData == undefined) {
                            throw new Error(`Problems getting nextData for`,current);
                        }
                        console.log(`Next Data`);
                        scriptStart = matched.next;
                        current.process = matched.next;
                        script = current.script; 
                    } catch (err) {
                        console.error(err);
                        console.error(`Error getting data for next: ${matched.next}`);
                    }
                }
                
                console.log(`We have question anwser`);
            } else {
                // Create que line
                let setData = {
                    ts : Date.now(),
                    action : command,
                    process : scriptStart,
                    script : script,
                    anwsers : {},
                    uuid : theUUID,
                    q : true
                }
                program.modules.telegram.functions.que.line[chatID] = setData;
                current = setData;
            }

            // Get item
            const theScript = script[scriptStart];

            if (scriptStart == `finish`) {
                // Delete from list
                setTimeout(function(){
                    delete program.modules.telegram.functions.que.line[chatID];
                },150);
            }

            // Create replacelist
            let replace = {
                "{{URL}}"   :   process.env.url,
                "{{WEBURL}}"   :   process.env.webURL,
                "{{TEST}}"  :   "TEST REPLACED"
            }

            // Check if anwsers
            if (Object.keys(current.anwsers).length > 0) {
                // Check the anwsers
                for (let anwserTXT in current.anwsers) {
                    const typedOf = typeof current.anwsers[anwserTXT].anwser;
                    
                    if (typedOf == `string`) {
                        replace[`{{${String(anwserTXT).toUpperCase()}}}`] = current.anwsers[anwserTXT].anwser;
                    }
                }
                console.log(`Check loop through anwsers`);
            }

            // Add items to replace
            console.log(`Add Items to replace`);

            // Check if text
            let toSend = {}
            if (theScript.object.text != undefined) {
                toSend.text = theScript.object.text;
            }

            // Get object
            if (theScript.object.image != undefined) {
                console.log(`Send Image`);
                toSend.image = theScript.object.image;
            }

            // Iterate through keys in toSend
            for (let key in toSend) {
                if (typeof toSend[key] === 'string') {
                    // Replace placeholders in the string globally
                    for (let placeholder in replace) {
                        toSend[key] = toSend[key].replace(new RegExp(placeholder, 'g'), replace[placeholder]);
                    }
                }
            }

            // Check if text
            let buttons;
            // check for buttons
            if (theScript.object.buttons != undefined) {
                buttons = JSON.stringify(theScript.object.buttons);
                // Loop through replace
                for (let repKey in replace) {
                    const newRegx = new RegExp(repKey, 'g');
                    buttons = buttons.replace(newRegx,replace[repKey]);
                }
                buttons = JSON.parse(buttons);
            }
            await program.modules.telegram.functions.send(program,toSend,middleValue.from.id,buttons);

            // set que uuid
            program.modules.telegram.functions.que.line[chatID] = current;
            
            console.log(`We have script data`);

            return current;
        } catch (err) {
            console.error(err);
            console.error(`Error with que something`);
            return false;
        }

        // Do all the things that we need to do in the run
        
    }
}