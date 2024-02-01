// Here we can collect something by when user enter collect state in telegram
module.exports = {
    line : {},
    set : function(id,data) {
        // To set que
        console.log(`Que Set Telegram`);
        this.line[id] = data;
        return this.line[id];
    },
    get : function(id) {
        console.log(`Que Get Telegram`);
        // Check if in que line
        let indexPart = Object.keys(this.line).indexOf(id);
        if (indexPart == -1) {
            return false;
        } else {
            let lineData = this.line[indexPart];
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
            if (program.modules.telegram.script.int[command] == undefined) {
                // Send message we don't know
                
                return false;
            } 

            // Create the que line command
            const script = program.modules.telegram.script.int[command];

            let current;

            if (program.modules.telegram.functions.que.line[chatID] != undefined) {
                // It's original que
                // Process response
                console.log(`It's a process`)
                current = program.modules.telegram.functions.que.line[chatID];
            } else {
                // Create que line
                let setData = {
                    ts : Date.now(),
                    action : command,
                    process : scriptStart,
                    script : script,
                    anwsers : {}
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

            program.modules.telegram.functions.que.line[chatID] = current;
            console.log(`We have script data`);
        } catch (err) {
            console.error(err);
            console.error(`Error with que something`);
        }

        // Do all the things that we need to do in the run
        
    }
}