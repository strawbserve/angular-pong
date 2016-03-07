angular
.module('pongApp')
.directive('paddle', function() {
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
            element.addClass('paddle');
            element.css('height', scope.paddles.height + 'px');
            element.css('width', scope.paddles.width + 'px');
            if ('left' == attrs.side) {
                element.css('float', 'left');
            }
            if ('right' == attrs.side) {
                element.css('float', 'right');
            }
            scope.$watch(
                function() { return attrs.y; },
                function(y) {
                    element.css('top', y + 'px');
                }
            );
            scope.$watch(
                function() { return scope.settings.colors.paddle; },
                function() {
                    element.css(
                        'background-color',
                        scope.settings.colors.paddle
                    );
                }
            );
        }
    };
})
