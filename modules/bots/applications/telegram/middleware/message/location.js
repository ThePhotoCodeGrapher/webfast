module.exports = async function(req,res,body,params,command,middleValue) {
    console.log(`Location Telegram Function`);
    // We have the start function
    
    return {
        message : `Thank you for sending your location\n ${middleValue.location.longitude}\n${middleValue.location.latitude}`   
    }
}