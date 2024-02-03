const { MongoClient } = require('mongodb');
module.exports = function(db,collection) {
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

    // Define the query you want to perform
    const query = { /* Your query goes here */ };

    async function main() {
    // Create a new MongoClient
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to the MongoDB server');

        // Select the database
        const database = client.db(dbName);

        // Select the collection
        const collection = database.collection(collectionName);

        // Perform the find query
        const result = await collection.find(query).toArray();

        // Process the result
        console.log('Query result:', result);
        return result;
    } finally {
        // Close the MongoClient
        await client.close();
        console.log('Connection closed.');
    }
    }

    // Execute the main function
    main().catch(console.error);

}