const { readdirSync } = require("fs");

console.log(`EventGO! Program`);
let program = {
    ts  :   Date.now(),
    modules : {}
}

// Setup The Requirements
async function set(program) {
    program.path = await require(`path`);
    program.fs = await require(`fs`);
    program.uuid = await require(`uuid`);
    return program;
}

// Program Fetch
program.modules.fetch = async function(folder,program) {
    // TO Fetch folder modules
    program = await set(program);
    try {
        // Loop through folder and run module if js
        const readPath = program.path.join(__dirname,folder);
        const readDir = program.fs.readdirSync(readPath);
        // Check if folder or not
        await readDir.forEach(async (item) => {
            const itemPath = program.path.join(readPath, item);
            const isDirectory = program.fs.statSync(itemPath).isDirectory();

            if (!isDirectory) {
                // So it's file
                // Run the file to know what to do but change program with the return
                //program = (require(itemPath)(program));
                //console.log(`Set`,itemPath);
            } else {
                // It's directory so read the init file
                const initPath = program.path.join(itemPath,`init.js`);
                program = await (require(initPath)(program));
            }
        });

    } catch(err) {
        console.error(`Error Program Modules Fetch`);
        console.error(err);
    }
}

program.modules.walkDirectory = async function (directoryPath,callback,forward) {
    // Read the contents of the current directory
    const files = await program.fs.readdirSync(directoryPath);
  
    let allFiles = [];
    // Iterate through the files in the directory
    for (let f in files) {
        // Construct the full path of the current file or directory
        let file = files[f];
        const fullPath = await program.path.join(directoryPath, file);

        // Check if the current item is a directory
        const pathSync = await program.fs.statSync(fullPath);
        const isDirectoryPath = await pathSync.isDirectory();
        const fileExtension = await program.path.extname(fullPath);

        // Get the filename without the extension
        const fileName = await program.path.basename(fullPath, fileExtension);
        if (isDirectoryPath) {
        // If it's a directory, recursively walk through it
            let pushData = await program.modules.walkDirectory(fullPath,callback,fileName);
            await allFiles.push(pushData);
        } else {
            // If it's a file, print the path
            // Get the file extension

            console.log('File Extension:', fileExtension);
            console.log('File Name:', fileName);

            // Make Key from fileName extension
            const fileData = {
                extension : fileExtension,
                name : fileName,
                path : fullPath,
                sub : []
            }
            
            if (forward != undefined) {
                // PUsh it to sub
                fileData.sub.push(forward);
                return fileData;
            } else {

                await allFiles.push(fileData);
            }
        }
    }



    if (forward != undefined) {
        // Return data
        
    }
    
    if (callback && forward == undefined) {
        await callback(allFiles);
    } else {
        return allFiles;
    }
  }
  

// Run program fetch
program.modules.fetch(`modules`,program);