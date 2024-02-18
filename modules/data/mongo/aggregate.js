const { MongoClient } = require('mongodb');
module.exports = async function(program,db,collection,query,callback) {
    // Ensure the MongoDB connection string is provided
    // Ensure the MongoDB connection string is provided
    if (!process.env.mongo) {
        console.error('MongoDB connection string not provided. Set process.env.mongo.');
        process.exit(1);
    }

    // Define the MongoDB URI
    const uri = process.env.mongo;

    // Define the database and collection name
    const dbName = db;
    const collectionName = collection;

    async function main() {
        // Create a new MongoClient
        const client = new MongoClient(uri);

        try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to the MongoDB server');

        // Select the database
        const database = client.db(dbName);

        // Select the collection
        const collection = database.collection(collectionName);

        // Perform the find query
        let result = await collection.find(query).toArray();

        if (one) {
            result = result[0];
        }

        // Process the result
        console.log('Query result:', result);
        } catch (error) {
        console.error('Error executing MongoDB query:', error);
        } finally {
        // Close the MongoDB connection
        await client.close();
        }
    }

    // Execute the main function
    return await main().catch(console.error);

}