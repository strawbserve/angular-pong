angular
.module('pongApp')
.directive('checkPaddleSpeed', function() {
    return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
            ctrl.$validators.checkPaddleSpeed = function(modelValue, viewValue) {
                var valid = true;
                if ( ! INTEGER_REGEXP.test(modelValue) ) {
                    valid = false;
                }
                else {
                    if (modelValue < 1 || modelValue > 100) {
                        valid = false;
                    }
                }
                if ( ! valid ) {
                    scope.settingsForm.$setValidity('checkPaddleSpeed', false);
                    return false;
                }
                scope.settingsForm.$setValidity('checkPaddleSpeed', true);
                return modelValue;
            }
        }
    };
})
