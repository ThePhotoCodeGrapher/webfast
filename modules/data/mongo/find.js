const { MongoClient } = require('mongodb');
module.exports = async function(db,collection,query,one = false,array) {
    // Ensure the MongoDB connection string is provided
    const program = array.program;
    let callback;
    if (array.function != undefined) {
        callback = array.function;
    }
    if (!process.env.mongo) {
        console.error('MongoDB connection string not provided. Set process.env.mongo.');
        process.exit(1);
    }

    function routeExists(path) {
        return program.express.app._router.stack.some(layer => {
            if (layer.route) {
                return layer.route.path === path;
            }
            return false;
        });
    }

    // Define the MongoDB URI
    const uri = process.env.mongo;

    // Define the database and collection name
    const dbName = db;
    const collectionName = collection;

    // Define the query you want to perform

    async function main() {
    // Create a new MongoClient
    const client = await new MongoClient(uri);

    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to the MongoDB server');

        // Select the database
        const database = await client.db(dbName);

        // Select the collection
        const collection = await database.collection(collectionName);

        // Perform the find query
        result = await collection.find(query).toArray();

        if (one == true) {
            result = result[0];
        }
        // Process the result
        console.log('Query result:', result);

        // Check if profile image to get it from db
        if (result.profileImage != undefined && array.image == true) {
            const profileImage = await program.modules.data.file.downloadBuffer(result.profileImage,process.env.dbName);

            // Set in dynamic routing for serving
            let sizeMeta = {};
            let other = {}
            for (let pi in profileImage) {
                // Profile image
                const theImage = profileImage[pi];

                // Get the meta
                const imageMeta = theImage.metadata;

                // Sizes
                const size = imageMeta.size;

                const sizeKey = `${size.width}x${size.height}`;
                const setUUID = program.uuid.v4();
                sizeMeta[setUUID] = {
                    buffer : theImage.buffer,
                    meta : imageMeta
                }
                console.log(`The Size Meta`);
            }

            // Now we have sizes thingy so create a route for this specific uuid
            const dynamicLink = `/dynamic/${result.profileImage}/list`;
            result.imageList = `${process.env.url}${dynamicLink.slice(1)}`;
            result.images = sizeMeta;

            const routeCheck = await routeExists(dynamicLink);
            if (!routeCheck) {
                program.express.app.get(dynamicLink, async (req, res) => {
                    // Requesting image
                    console.log(`Requesting dynamic link`);
                    // Send buffer image as image
                    // Set content type header to indicate that you're sending an image
                    res.setHeader('Content-Type', 'application/json');

                    // Send the image buffer as the response body
                    for (let sizeKey in sizeMeta) {
                        const item = sizeMeta[sizeKey];
                        other[sizeKey] = item.meta;

                        // Create dynamic url for this on
                        const imageDynamicPath = `/dynamic/${sizeKey}.${item.meta.type}`;
                        const imageLinkURL = `https://${process.env.url}${imageDynamicPath.slice(1)}`
                        //other[sizeKey].link = imageLinkURL;

                        // generate dynamic url
                        
                    }
                    
                    res.send(JSON.stringify(other, null, 2));
                });
            }
            console.log(`Profile Image`);

            // generate paths
        }

        if (callback != undefined) {
            
            callback(program,result);
        } else {
            return result;
        }
    } finally {
        // Close the MongoClient
        await client.close();
        console.log('Connection closed.');
    }
    }

    // Execute the main function
    await main().catch(console.error);

}