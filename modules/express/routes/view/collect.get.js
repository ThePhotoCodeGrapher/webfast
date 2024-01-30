module.exports = async function(program,req,res,route,body,params) {
    console.log(`Collect`);
    const fullPath = program.path.join(__dirname, `..`,`..`,`..`,`..`,`ejs`,`collect`,`event.ejs`);

    // Render the EJS template
    res.render(fullPath, {
        title: 'EJS Example',
        name: 'John Doe',
        isAdmin: true,
        fruits: ['Apple', 'Banana', 'Orange'],
        url : process.env.url.slice(process.env.url.length-1,1)
    });
}