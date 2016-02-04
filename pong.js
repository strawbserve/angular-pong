angular.module('pongApp', [])
.controller('PongController', ['$scope', '$interval', function($scope, $interval) {
    var wallBeep = new Audio("pong_8bit_wall.wav");
    var paddleBeep = new Audio("pong_8bit_paddle.wav");
    var outBeep = new Audio("pong_8bit_out.wav");

    var box = angular.element(document.querySelector('#pong-court'));
    box = box[0];
    var paddlePercent = 15;
    var paddleHeight = Math.floor(box.clientHeight*paddlePercent/100);
    var paddleMaxY = box.clientHeight - paddleHeight;
    $scope.scores = {
        left: 0,
        right: 0
    };
    $scope.paddles = {
        left: { y: paddleMaxY/2 },
        right: { y: paddleMaxY/2 },
        paddleHeight: paddleHeight
    };
    var keyMap = {
        13: 'serve',
        27: 'stopGame',
        87: 'leftUp',
        83: 'leftDown',
        38: 'rightUp',
        40: 'rightDown'
    };
    var keyActions = {
        serve: function() {
            $scope.serve();
        },
        stopGame: function() {
            $scope.stopGame();
        },
        leftUp: function() {
            $scope.movePaddle('left', 'up');
        },
        leftDown: function() {
            $scope.movePaddle('left', 'down');
        },
        rightUp: function() {
            $scope.movePaddle('right', 'up');
        },
        rightDown: function() {
            $scope.movePaddle('right', 'down');
        }
    };
    var intervals = {}
    $scope.movePaddle = function(side, direction) {
        if (angular.isDefined(intervals[side + direction])) return;
        var sign = 1; 
        if ('up' == direction) {
            sign = -1;
        }
        intervals[side + direction] = $interval(function() {
            if (1 == sign && paddleMaxY <= $scope.paddles[side].y) return;
            if (-1 == sign && 0 >= $scope.paddles[side].y) return;
            $scope.paddles[side].y += 3 * sign;
        }, 10);
    }
    angular.element(document).on('keydown', function(e) {
        if (undefined != keyMap[e.keyCode]) {
            if (undefined != keyActions[keyMap[e.keyCode]]) {
                keyActions[keyMap[e.keyCode]]();
            }
        }
    });
    angular.element(document).on('keyup', function(e) {
        if (undefined != keyMap[e.keyCode]) {
            var interval = keyMap[e.keyCode].toLowerCase();
            if (angular.isDefined(interval)) {
                $interval.cancel(intervals[interval]);
                intervals[interval] = undefined;
            }
            
        }
    });
    var stop;
    $scope.ball = {
        x: -50,
        y: Number(box.clientHeight/2),
        velocities: {
            x: 450,
            //y: 100 
            y: Math.floor(Math.random().toPrecision(3) * 1000)
        },
        color: '#ccc'
    };
    $scope.tick = function() {
        $scope.ball.ts = undefined;
        if (angular.isDefined(stop)) return;
        stop = $interval(function() {
            var max = {
                x: box.clientWidth,
                y: box.clientHeight
            };
            var now = new Date().getTime();
            var elapsed = ($scope.ball.ts || now) - now;

            $scope.ball.ts = now;

            setBallPosition('x');
            setBallPosition('y');
            function setBallPosition(axis) {
                var velocity = $scope.ball.velocities[axis]/1000;
                $scope.ball[axis] += Math.floor(elapsed * velocity);
            }

            setBallSpeed('x', $scope.ball.x);
            setBallSpeed('y', $scope.ball.y);
            function setBallSpeed(axis, value) {
                var min = 1;
                var side = 'right';
                var otherSide = 'left';
                if (0 < $scope.ball.velocities.x) {
                    side = 'left';
                    otherSide = 'right';
                }
                var sideY = $scope.paddles[side].y;
                var ballY = $scope.ball.y;
                var missed = (
                    'x' == axis &&
                    (
                        sideY > ballY || 
                        sideY + $scope.paddles.paddleHeight < ballY
                    )
                );
                if ($scope.ball[axis] > max[axis]) {
                    if (missed) { handleMiss(); } else { beep(axis) };
                    $scope.ball[axis] = 2 * max[axis] - $scope.ball[axis];
                    $scope.ball.velocities[axis] *= -1;
                }
                if ($scope.ball[axis] < min) {
                    if (missed) { handleMiss(); } else { beep(axis) };
                    $scope.ball[axis] = min;
                    $scope.ball.velocities[axis] *= -1;
                }
                function beep(axis) {
                    if ('x' == axis) { paddleBeep.play(); }
                    if ('y' == axis) { wallBeep.play(); }
                }
                function handleMiss() {
                    $scope.scores[otherSide]++;
                    outBeep.play();
                    $scope.sideOut = side;
                    $scope.stopGame();
                }
            }
        }, 20);
    };
    $scope.startGame = function() {
        $scope.tick();
    };
    $scope.stopGame = function() {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        }
    };
    $scope.serve = function() {
        var sign = 1;
        if (undefined == $scope.sideOut) {
            var sides = ['left', 'right'];
            $scope.sideOut = sides[Math.floor(Math.random()*10)%2];
        }
        $scope.ball.x = box.clientWidth;
        $scope.ball.y = Math.floor(box.clientHeight)/2;
        $scope.ball.velocities.x = $scope.getRandomVelocity('x');
        $scope.ball.velocities.y = $scope.getRandomVelocity('y');
        if ('right' == $scope.sideOut) {
            $scope.ball.x = 1;
            $scope.ball.y = Math.floor(box.clientHeight)/2 - 1;
            // make sure the ball is going the right direction
            if (0 <= $scope.ball.velocities.x) { sign = -1; }
            
        }
        // make sure the ball is going the right direction
        else if (0 > $scope.ball.velocities.x) {
            sign = -1;
        }
        $scope.ball.velocities.x *= sign;
        $scope.startGame();
    };
    $scope.getRandomVelocity = function(axis) {
        var dimension = 'Height';
        var precision = 3;
        if ('x' == axis) {
            dimension = 'Width';
            precision = 2;
        }
        var side = box['client' + dimension];
        var halfSide = side/2;
        var sign = $scope.randomSign();
        var rand = $scope.randomInt(precision);
        var sizeAdjustment = 1 - (100/side);
        var mod = (rand * sizeAdjustment) * sign;
        return Math.floor(halfSide + mod);
    };
    $scope.randomInt = function(p) {
        return Math.floor(
            Math.random().toPrecision(p)*Math.pow(10,p)
        );
    };
    $scope.randomSign = function() {
        var randNum = $scope.randomInt(1);
        return (randNum % 2) ? 1 : -1;
    };
}])
.directive('ball', function() {
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
            element.addClass('circle');
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
                function() { return attrs.color; },
                function(color) {
                    element.css('background-color', color);
                }
            );
        }
    };
})
.directive('paddle', function() {
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
            element.addClass('paddle');
            element.css('height', scope.paddles.paddleHeight + 'px');
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
        }
    };
})
;
