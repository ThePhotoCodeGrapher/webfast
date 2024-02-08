module.exports = async function(program,req,res,body,params,command,middleValue) {
    console.log(`Location Telegram Function`);
    // We have the start function
    let locSendMessage = false;

    // Now get the photos and save them in db files
    // loop through photos
    const user = middleValue.from.id;
    const uuid = program.uuid.v4();
    for (let photoI in middleValue.photo) {
        let photo = middleValue.photo[photoI];
        // photo url user
        const userPhotoURL = await program.modules.telegram.functions.get.file(program,photo.file_id);
        console.log(userPhotoURL);
         // create url
         const photoURL = `https://api.telegram.org/file/bot${process.env.telegram}/${userPhotoURL.result.file_path}`;;

         //res.status(200);
         // Now do the fetch process thingy
         await program.modules.telegram.functions.get.downloadAndConvertToBase64(program,photoURL,async function(program,response){
             console.log(`We have now file data`);
             // Create id for file that is unique uuid
             const meta = {
                 user : response.data.user,
                 type : response.imageData.type,
                 size : {
                     width : response.imageData.width,
                     height : response.imageData.height
                 }
             }
             await program.modules.data.file.uploadBuffer(program,response.buffer,uuid,meta,async function(progam,upload,meta){
                 console.log(`Uploaded Buffer`);
                 // Save to membe
                 // Now we have received so we can add marker to the receive message
             });
             
         },{
             user : user,
             data : middleValue
         });

    }

    res.status(200);
    
    locSendMessage = `Image succesfull received`;

    const scripting = await program.modules.telegram.script.function.check(program,command,middleValue.chat.id,middleValue,body);
    console.log(scripting);
    
    // Send back
    return {
        message : locSendMessage,
        response : {
            message : locSendMessage,
            uuid : uuid
        }
    }
}