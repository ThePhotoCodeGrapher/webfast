module.exports = {
    dependOn : [`express.app`],
    name : 'data',
    run : async function(program,name) {
        console.log(`Running ${name}`);

        // Lets make a mockup
        const routesPath = program.path.join(__dirname,`mongo`);
        let moduleData = await program.modules.walkDirectory(routesPath);
        
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
                setModule[module.name] = require(module.path);
            } catch (err) {
                console.error(`Error Setting Module Data`,module.name);
            }
        }
        
        // Put in program modules
        program.modules[this.name] = setModule;
        
        // Here we can do whatever like grab modules for generator and represent them here
        return program;
    }
}