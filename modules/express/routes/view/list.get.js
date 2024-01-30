module.exports = async function(program,req,res,route) {
    console.log(`Create`);
    const fullPath = program.path.join(__dirname, `..`,`..`,`..`,`..`,`ejs`,`example`,`list.ejs`);

    // Render the EJS template
    res.render(fullPath, {
        title: 'EJS Example',
        name: 'John Doe',
        isAdmin: true,
        fruits: ['Apple', 'Banana', 'Orange']
    });
}