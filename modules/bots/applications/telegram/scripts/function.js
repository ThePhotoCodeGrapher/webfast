module.exports = {
    check : async function (program,command,chatID,middleValue,received) {
        // Checkif there is que
        console.log(`Check if there is script`);
        try {
            const scriptData = program.modules.telegram.script.int[command];
            if (scriptData == undefined && program.modules.telegram.functions.que.get(chatID,program) == false) {
                await program.modules.telegram.functions.send(program,`Sorry we don't understand: ${command}`,chatID,[
                    [
                        { text: 'EventGO!',  web_app : { url : 'https://cloud.eventgo.today/events/list'}},
                        { text: 'Create Event', callback_data: 'create_event' },
                    ]
                ]);
            } else {
                // We have some script so check if we have in que
                const queData = await program.modules.telegram.functions.que.run(program,command,chatID,middleValue,received);

                // Check if queData is empty otherwise we will run the script from "start", if que data is not empty we run it further
                //  unt o process script 
                // now it's just wait
                console.log(`Went through que get`);
                // Send message
                if (queData == false) {
                    await program.modules.telegram.functions.send(program,`Sorry we don't know what to do with: ${command}`,chatID);
                } else if (queData.process != `start`) {
                    // Process the que event
                    console.log(`Process the que event`);
                    
                }
            }
            console.log(`Setted`);

            return true;
        } catch(err) {
            console.error(err);
            console.error(`Error Scripting`);
        }
    },
    response : async function() {
        console.log(`Function Response`);
    }
}