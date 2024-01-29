const { MongoClient } = require('mongodb');

module.exports = async function(db, collection, condition, dataToCreate) {
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
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        try {
            // Connect to the MongoDB server
            await client.connect();
            console.log('Connected to the MongoDB server');

            // Select the database
            const database = client.db(dbName);

            // Select the collection
            const collection = database.collection(collectionName);

            // Check if a document exists based on the condition
            const existingDocument = await collection.findOne(condition);

            if (existingDocument) {
                // If a document exists, return it
                console.log('Document found:', existingDocument);
                return existingDocument;
            } else {
                // If no document exists, create a new one
                console.log('Document not found. Creating a new one.');
                const result = await collection.insertOne(dataToCreate);

                if (result.insertedCount === 1) {
                    console.log('New document created:', result.ops[0]);
                    return result.ops[0];
                } else {
                    console.error('Failed to create a new document.');
                    return null;
                }
            }
        } finally {
            // Close the MongoClient
            await client.close();
            console.log('Connection closed.');
        }
    }

    // Execute the main function
    return main().catch(console.error);
};
