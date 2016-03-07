angular
.module('pongApp')
.directive('court', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            scope.$watch(
                function() { return scope.settings.colors.court; },
                function() {
                    element.css('background-color', scope.settings.colors.court);
                }
            );
        }
    };
});
