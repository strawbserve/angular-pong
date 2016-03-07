angular
.module('pongApp')
.filter('capitalize', function() {
    return function(input) {
        if (null == input) { return; }
        input = input.toLowerCase();
        return input.substring(0,1).toUpperCase() + input.substring(1);
    }
})
