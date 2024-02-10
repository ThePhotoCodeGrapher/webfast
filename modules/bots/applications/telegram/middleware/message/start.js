module.exports = async function(req,res,body,params,command,middleValue,received,program) {
    console.log(`Start Telegram Function`);
    // We have the start function
    
    // Do the script thing
    if (middleValue.text.startsWith(`/`)) {
        middleValue.text = `start`;
        const scripting = await program.modules.telegram.script.function.check(program,command,middleValue.chat.id,middleValue,received);
        console.log(`Scripting`);

        if (scripting == true) {
            return {
                response : true
            };
        } else {
            return {    
                response : {
                    message : `Thank you : ${command}`   
                }
            }
        }
    } else {
        return true;
    }

}