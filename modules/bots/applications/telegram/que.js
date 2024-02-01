// Here we can collect something by when user enter collect state in telegram
module.exports = {
    line : {},
    set : function(id) {
        // To set que
        console.log(`Que Set Telegram`)
    },
    get : function(id) {
        console.log(`Que Get Telegram`)
    },
    timer : function() {
        // Run timer
        console.log(`Timer Run`);
    }
}