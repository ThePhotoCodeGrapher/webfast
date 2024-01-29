const { readdirSync } = require("fs");

console.log(`WebFast!! Program`);
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
program.modules.dependOn = async function(reqFunc,program,name,callback) {
    console.log(`Depend On Check`);
    // Loop Through dependOn if its not true then check
    for (let dependIndex in reqFunc.dependOn) {
        const dependOn = reqFunc.dependOn[dependIndex];
        // So we dependOn 
        // Check index
        // If .
        let split = dependOn.split(`.`);
        // Now we should loop through array
        let objectData = program;
        let fullObjectPath = `program`;
        let dependOnItem = ``;
        for (let spl in split) {
            // Grab object
            let toCheck = split[spl];
            if (objectData[toCheck] == undefined) {
                await setTimeout(async function(){
                    return await program.modules.dependOn(reqFunc,program,name,callback);
                },200);
            } else {
                // New object thing and og next
                if (split.length-1 != spl) {
                    fullObjectPath = fullObjectPath + `.${toCheck}`
                } else {
                    // Depend on
                    dependOnItem = toCheck;
                }
                objectData = objectData[toCheck];
            }
        }

        let progData = await eval(fullObjectPath);
        const IndexCheck = Object.keys(progData).indexOf(dependOnItem);
        if (IndexCheck == -1) {
            // We need to wait and try again untill we can return
            console.log(`DependOn Fail: ${dependOn}`);
            await setTimeout(async function(){
                return await program.modules.dependOn(reqFunc,program);
            },200);
        } else {
            console.log(`DependOn Succes: ${dependOn}`);
            progData[dependOnItem] = {
                depend : dependOn,
                state : true,
                ts : Date.now()
            }

            // Now include this thing then
            try {
                program.modules[reqFunc.name] = await reqFunc.run(program,reqFunc.name);
                if (callback != undefined) {
                    return callback(program,name)
                } else {
                    return program;
                }
            } catch(err) {
                // When erro
                console.error(`Error Program add depend on require`);
                console.error(err);
            }
        }
    }
}

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
            // Get the filename with extension
            const fileNameWithExtension = program.path.basename(itemPath);

            // Get the filename without extension
            const fileNameWithoutExtension = program.path.parse(fileNameWithExtension).name;

            console.log('Filename without extension:', fileNameWithoutExtension);

            const isDirectory = program.fs.statSync(itemPath).isDirectory();

            if (!isDirectory) {
                // So it's file
                // Run the file to know what to do but change program with the return
                //program = (require(itemPath)(program));
                //console.log(`Set`,itemPath);
            } else {
                // It's directory so read the init file
                const initPath = program.path.join(itemPath,`init.js`);

                // Require first
                const reqFunc = require(initPath);
                const theType = typeof reqFunc;
                switch (theType) {
                    case `object`:
                        // It's a object so check for dependend things etc.
                        console.log(`Depending object`);
                        await program.modules.dependOn(reqFunc,program,fileNameWithoutExtension,function(program,name){
                            console.log(`Setup `,name)
                        });
                    break;
                    case `function`:
                        program = await (require(initPath)(program));
                    break;
                    default:
                        console.error(`Error Missing typeOf item`);
                }
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