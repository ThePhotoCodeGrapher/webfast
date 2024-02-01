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
            const script = program.modules.telegram.script.int[command];

            let current;

            let theUUID = program.uuid.v4();
            if (program.modules.telegram.functions.que.line[chatID] != undefined) {
                // It's original que
                // Process response
                console.log(`It's a process`)
                current = program.modules.telegram.functions.que.line[chatID];
                theUUID = current.uuid;

                // Check what to do next first of all save anwser
                const question = current.script[current.process];
                const anwser = middleValue;
                
                console.log(`We have question anwser`);
            } else {
                // Create que line
                let setData = {
                    ts : Date.now(),
                    action : command,
                    process : scriptStart,
                    script : script,
                    anwsers : {},
                    uuid : theUUID
                }
                program.modules.telegram.functions.que.line[chatID] = setData;
                current = setData;
            }

            // Get item
            const theScript = script[scriptStart];

            // Create replacelist
            let replace = {
                "{{URL}}"   :   process.env.url,
                "{{TEST}}"  :   "TEST REPLACED"
            }

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
            await program.modules.telegram.functions.send(program,toSend,middleValue.chat.id);

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