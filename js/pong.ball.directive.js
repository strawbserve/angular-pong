angular
.module('pongApp')
.directive('ball', function() {
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
            element.addClass('circle');
            element.css('height', scope.ball.height);
            element.css('width', scope.ball.width);
            scope.$watch(
                function() { return attrs.x; },
                function(x) {
                    element.css('left', x + 'px');
                }
            );
            scope.$watch(
                function() { return attrs.y; },
                function(y) {
                    element.css('top', y + 'px');
                }
            );
            scope.$watch(
                function() { return scope.settings.colors.ball; },
                function(color) {
                    element.css(
                        'background-color',
                        scope.settings.colors.ball
                    );
                }
            );
        }
    };
})
