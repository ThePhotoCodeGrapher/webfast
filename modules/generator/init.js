module.exports = {
    dependOn : [`express.app`],
    name : 'generator',
    run : function(program,name) {
        console.log(`Running ${name}`);

        // Here we can do whatever like grab modules for generator and represent them here
        return program;
    }
}