const path = require(`path`);
const contentPath = path.join(__dirname,`example`,`content`)
let program = require(path.join(__dirname,`index.js`))({
    wget : '/usr/local/bin/wget',
    process : {
        ts : Date.now()
    },
    contentPath : contentPath
});
console.log(`Required`);