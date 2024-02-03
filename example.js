const path = require(`path`);
let program = require(path.join(__dirname,`index.js`))({
    wget : '/usr/local/bin/wget'
});
console.log(`Required`);