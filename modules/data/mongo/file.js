const { MongoClient, GridFSBucket } = require('mongodb');
const fs = require('fs');

// Define the MongoDB URI
const uri = process.env.mongo;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = {
    uploadBuffer: async function (progam,buffer, filename, metadata = {}, callback) {
        const dbName = 'eventgo';
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
        await client.connect();

        const db = client.db(dbName);
        const bucket = new GridFSBucket(db);

        const downloadStream = bucket.openDownloadStreamByName(filename);

        return new Promise((resolve, reject) => {
            const chunks = [];

            // Accumulate chunks as they arrive
            downloadStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            // Resolve with the concatenated buffer and metadata when the download is complete
            downloadStream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const metadata = downloadStream.s.file.metadata;
                resolve({ buffer, metadata });
            });

            downloadStream.on('error', reject);
        });
    }
};
