const { MongoClient } = require('mongodb');
const uri = process.env.mongo;
const client = new MongoClient(uri);

module.exports = {
    profilePhoto : async function(program,content,meta) {
        console.log(`Set User Profile Pic`);
        const added = await program.modules.telegram.functions.set.addToCollection(program,`telegram`, `profileImage`, meta.name,{
            id : meta.user
        });
        console.log(`Added`);
    },
    addToCollection : async function (program,collectionName, fieldName, data,search) {
        try {
            await client.connect();
            const db = client.db('eventgo');
            const collection = await db.collection(collectionName);
    
            // Check if the field is an array in the existing document
            const existingDocument = await collection.findOne(search);
            const isFieldArray = Array.isArray(existingDocument[fieldName]);
    
            if (isFieldArray) {
                // Field is an array, push the data
                await collection.updateOne(search, { $addToSet: { [fieldName]: { $each: data } } });
            } else {
                // Field is not an array, save the array
                await collection.updateOne(search, { $set: { [fieldName]: data } }, { upsert: true });
            }
    
            console.log('Data added to the collection successfully.');
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
        }
    }    
}