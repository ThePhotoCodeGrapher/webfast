module.exports = {
    UserProfilePhotos : async function(program,user,callback) {
        console.log(`Get User Profile Photos`);
        // Save user photo when first time
        // Create call
        const userPhotos = await program.modules.telegram.functions.get.request(`getUserProfilePhotos`,{
            user_id : user.id
        },program,callback);
        console.log(`The User Photo`);
        // convert base64 and save to database
        const uuid = program.uuid.v4();
        for (let userI in userPhotos.result.photos) {
            // Make request for file
            let profilePictures = userPhotos.result.photos[userI]
            // Telegram will give back an array
            for (let profileI in profilePictures) {
                const profilePictureData = profilePictures[profileI];
                const fileID = profilePictureData.file_id;
                const fileUnique = profilePictureData.file_unique_id;

                try {
                    const userPhotoURL = await program.modules.telegram.functions.get.file(program,fileID);
                    
                    // create url
                    const photoURL = `https://api.telegram.org/file/bot${process.env.telegram}/${userPhotoURL.result.file_path}`;;

                    // Now do the fetch process thingy
                    await program.modules.telegram.functions.get.downloadAndConvertToBase64(program,photoURL,async function(program,response){
                        console.log(`We have now file data`);
                        // Create id for file that is unique uuid
                        const meta = {
                            user : response.data.user.id,
                            type : response.imageData.type,
                            size : {
                                width : response.imageData.width,
                                height : response.imageData.height
                            }
                        }
                        await program.modules.data.file.uploadBuffer(program,response.buffer,uuid,meta,async function(progam,upload,meta){
                            console.log(`Uploaded Buffer`);
                            // Save to membe
                            await program.modules.telegram.functions.set.profilePhoto(progam,upload,meta);
                        });
                        
                    },{
                        user : user,
                        data : profilePictureData
                    });
                } catch (err) {
                    console.error(`Error For Downloading file`);
                }    
            }
        }
    },
    file : async function(program,fileID,callback) {
        // TO get the file from telegram
        const getFile = await program.modules.telegram.functions.get.request(`getFile`,{
            file_id : fileID
        },program,callback);
        return getFile;
    },
    downloadAndConvertToBase64 : async (program, photoURL, callback,data) => {
        try {
            // Use wget to download the image
            const { stdout, stderr } = await program.exec(`${program.set.wget} -O - ${photoURL}`, { encoding: 'buffer' });
    
            // Check if the download was successful
            const errBuf = Buffer.from(stderr);
            const errorText = errBuf.toString('utf-8');
            // Check if the errorText contains "200 OK"
            if (errorText.includes('200 OK')) {
                // The request was successful
                console.log('Download successful');
            } else {
                // The request encountered an error
                console.error('Download failed:', errorText);
                throw new Error(`Failed to download image. Error: ${stderr}`);
            }
    
            // Convert the downloaded buffer to base64
            const buffer = Buffer.from(stdout);
            const base64 = buffer.toString('base64');
    
            // Determine the MIME type and dimensions of the image
            const dimensions = program.image.size(buffer);
            const { width, height, type } = dimensions;
    
            // Log the details
            console.log('MIME Type:', type);
            console.log('Dimensions:', `${width}x${height}`);
    
            // Now you can use the base64 encoded string
            //console.log('Base64:', base64);
    
            // Call the callback with the result
            callback(program,{
                base: base64,
                imageData: dimensions,
                type: type,
                data : data,
                buffer : buffer
            });
    
            return true;
        } catch (error) {
            console.error('Error:', error.message);
            return false;
        }
    },
    request : async function(path, body,program,callback) {
        // Make request with url
        console.log(`Make Telegram Get Request`);
        let respData = {}
        const url = `https://api.telegram.org/bot${process.env.telegram}/${path}`;
        // We have url make request
        respData = await program.modules.request.post(program,url,body)
        
        if (callback != undefined) {
            return callback(madeRequest);
        } else {
            return respData;
        }
    }
}