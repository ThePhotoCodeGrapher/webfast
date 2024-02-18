const { MongoClient, GridFSBucket } = require('mongodb');
const fs = require('fs');

// Define the MongoDB URI
const uri = process.env.mongo;
const client = new MongoClient(uri);

module.exports = {
    uploadBuffer: async function (progam,buffer, filename, metadata = {}, callback) {
        const dbName = process.env.dbName;
        await client.connect();

        const db = client.db(dbName);
        const bucket = new GridFSBucket(db);

        const uploadStream = bucket.openUploadStream(filename, { metadata });

        uploadStream.end(buffer); // Write the buffer directly to the upload stream

        new Promise((resolve, reject) => {
            uploadStream.on('finish', () => {
                // Access the ObjectId assigned to the stored file
                const fileId = uploadStream.id;
                let objectID = resolve(fileId);
                console.log(`File ID hing`);
                metadata.name = filename;
                callback(progam,uploadStream,metadata);
            });

            uploadStream.on('error', reject);
        });
    },

    downloadBuffer: async function (filename, dbName = 'media') {
        try {
            await client.connect();
            const db = client.db(dbName);
    
            // Find all files with the given filename
            const filesCollection = db.collection('fs.files');
            const files = await filesCollection.find({ filename: filename }).toArray();
    
            // If no files found, return null
            if (files.length === 0) {
                return null;
            }
    
            // Initialize an array to store download promises
            const downloadPromises = [];
    
            // Loop through each file and download it
            files.forEach(file => {
                const bucket = new GridFSBucket(db);
                const downloadStream = bucket.openDownloadStreamByName(filename);
                downloadPromises.push(new Promise((resolve, reject) => {
                    const chunks = [];
                    downloadStream.on('data', (chunk) => {
                        chunks.push(chunk);
                    });
                    downloadStream.on('end', () => {
                        const buffer = Buffer.concat(chunks);
                        const metadata = downloadStream.s.file.metadata;
                        resolve({ buffer, metadata });
                    });
                    downloadStream.on('error', reject);
                }));
            });
    
            // Wait for all download promises to resolve
            const results = await Promise.all(downloadPromises);
    
            return results;
        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        } finally {
            // Close the MongoDB connection
            await client.close();
        }
    }
    
};
