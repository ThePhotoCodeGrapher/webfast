module.exports = {
    dependOn : [`express.app`],
    name : 'bot',
    run : async function(program,name) {
        if (process.env.bot == 'false') {
            return false;
        }

        console.log(`Running ${name}`);
        // Scan bots folder and exclude
        const routesPath = program.path.join(__dirname,`applications`);
        let moduleData = await program.modules.walkDirectory(routesPath);

        // We have the folder loop through
        // Set Module
        let setModule = {
            ts : Date.now()
        }

        // loop Throuh module data 
        for (let moduleIndex in moduleData) {
            // Get the module
            let module = moduleData[moduleIndex];
            // Create module in setModule
            try {
                // We have set module
                const pathSync = await program.fs.statSync(module.path);
                const isDirectoryPath = await pathSync.isDirectory();
                const fileExtension = program.path.extname(module.path);

                // Check if directory
                if (isDirectoryPath) {
                    // It's directory so don't do anything yet
                    console.log(`It's Directory init bots`);
                } else {
                    const runModule = await require(module.path)(program,module);
                    setModule[module.name] = runModule;
                }
                
            } catch (err) {
                console.error(err);
                console.error(`Error Setting Module Data`,module.name);
            }
        }
        
        // Put in program modules
        program.modules[this.name] = setModule;
        
        // Here we can do whatever like grab modules for generator and represent them here
        return program;
    }
}