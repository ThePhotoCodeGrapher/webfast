// Here we can collect something by when user enter collect state in telegram
module.exports = async function(program,key,action,uuid,subFunction,middleValue) {
    console.log(`Sub Function : ${key}`,uuid,subFunction);

   
    return true
}