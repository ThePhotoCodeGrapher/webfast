module.exports = {
    check : async function (program,command,chatID,middleValue,received) {
        // Checkif there is que
        console.log(`Check if there is script`);
        try {
            const scriptData = program.modules.telegram.script.int[command];
            if (scriptData.length == 0) {
                await program.modules.telegram.functions.send(program,`${command}`,chatID,[
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

                console.log(`Went through que get`);
            }
            console.log(`Setted`);

            return true;
        } catch(err) {
            console.error(err);
            console.error(`Error Scripting`);
        }
    }
}