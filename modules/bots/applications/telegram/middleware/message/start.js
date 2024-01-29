module.exports = async function(req,res,body,params,command,middleValue) {
    console.log(`Start Telegram Function`);
    // We have the start function
    
    return {
        response : {
            message : `Thank you : ${command}`   
        }
    }
}