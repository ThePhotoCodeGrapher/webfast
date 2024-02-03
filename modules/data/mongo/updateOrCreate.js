const { MongoClient } = require('mongodb');

module.exports = async function (db, collection, condition, dataToUpdate) {
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

            // Perform the update or create operation
            const result = await collection.updateOne(condition, { $set: dataToUpdate }, { upsert: true });

            // If a document was upserted, retrieve the upserted document
            const upsertedDocument = result.upsertedId
                ? await collection.findOne({ _id: result.upsertedId })
                : null;

            // Process the result
            if (upsertedDocument) {
                console.log('Document upserted:', upsertedDocument);
                return upsertedDocument;
            } else {
                console.log('Document updated.');
                return dataToUpdate;
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
