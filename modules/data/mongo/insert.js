const { MongoClient } = require('mongodb');

module.exports = async function(db, collection, dataToInsert) {
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

    // Function to insert data
    async function insertData() {
        const client = new MongoClient(uri);
    
        try {
            await client.connect();
            console.log('Connected to MongoDB server');
        
            const database = client.db(dbName);
            const collection = database.collection(collectionName);
        
            // Insert the data
            const result = await collection.insertOne(dataToInsert);
            console.log(`Document inserted with _id: ${result.insertedId}`);
            return result;
        } catch (error) {
            console.error('Error inserting document:', error);
        } finally {
            // Close the connection
            await client.close();
        }
    }

    // Execute the main function
    return insertData().catch(console.error);
};
