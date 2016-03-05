var INTEGER_REGEXP = /^\-?\d+$/;
angular.module('pongApp', ['ui.bootstrap', 'ngTouch'])
.filter('capitalize', function() {
    return function(input) {
        if (null == input) { return; }
        input = input.toLowerCase();
        return input.substring(0,1).toUpperCase() + input.substring(1);
    }
})
.factory('Data', function() {
    return {
        settings: {
            default: {
                numPlayers: 1,
                autoSide: 'left',
                soundOn: 1,
                paddleSpeed: 50,
                showDirections: true,
                colors: {
                    court: '#333333',
                    paddle: '#cccccc',
                    ball: '#cccccc'
                }
            },
            active: false,
            localStorageId: 'angular-pong.settings',
            get: function(setting) {
                if (false === this.active) {
                    this.active = JSON.parse(localStorage.getItem(this.localStorageId));
                    if (null == this.active) {
                        this.active = this.default;
                    }
                }
                if (undefined != setting) {
                    return this.active[setting];
                } else {
                    return this.active;
                }
            },
            save: function(settings) {
                this.active = settings;
                localStorage.setItem(this.localStorageId, JSON.stringify(settings));
            },
            reset: function() {
                this.active = this.default;
                this.save(this.active);
            },
            clearLocal: function() {
                localStorage.removeItem(this.localStorageId);
            }
        }
    }
})
.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, Data) {

    // The JSON calls get us a copy of the settings so we can cancel.
    $scope.settings = JSON.parse(JSON.stringify(Data.settings.get()));

    $scope.$on('modalOkay', function(event, arg) {
        $scope.ok();
    });

    $scope.clearLocal = function() {
        Data.settings.clearLocal();
    };

    $scope.resetSettings = function() {
        Data.settings.reset();
        $scope.settings = Data.settings.get();
    };

    $scope.ok = function() {
        $uibModalInstance.close($scope.settings);
    };

    $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };

})
.controller('PongController', ['$rootScope', '$scope', '$window', '$interval', '$uibModal', 'Data', function($rootScope, $scope, $window, $interval, $uibModal, Data) {

    $scope.settings = Data.settings.get();

    $scope.animationsEnabled = true;

    $scope.openModal = function (size) {

        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'myModalContent.html',
            controller: 'ModalInstanceCtrl',
            size: size
        });

        modalInstance.result.then(function (settings) {
            $scope.settings = settings;
            Data.settings.save(settings);
        }, function () {
            //$log.info('Modal dismissed at: ' + new Date());
        });

        $scope.modal = modalInstance;;
    };
    if ($scope.settings.showDirections) {
        $scope.openModal();
    }

/*
    $scope.toggleAnimation = function () {
          $scope.animationsEnabled = !$scope.animationsEnabled;
    };
*/

    var windowHeight = $window.innerHeight;
    var windowWidth = $window.innerWidth;

    var paddleHeightPercent = 15;
    var paddleHeight = Math.floor(windowHeight*paddleHeightPercent/100);
    var paddleMaxY = windowHeight - paddleHeight;

    var keyMap = {
        13: 'handleEnter',
        27: 'handleEsc',
        87: 'leftUp',   // w
        83: 'leftDown', // s
        38: 'rightUp',  // up arrow
        40: 'rightDown' // down arrow
    };
    var intervals = {}

    $scope.wallBeep = new Audio("pong_8bit_wall.wav");
    $scope.paddleBeep = new Audio("pong_8bit_paddle.wav");
    $scope.outBeep = new Audio("pong_8bit_out.wav");

    $scope.playSound = function(sound) {
        if (0 == $scope.settings.soundOn ) { return; }
        if (undefined != $scope[sound]) {
            $scope[sound].play();
        }
    };
    $scope.scores = {
        left: 0,
        right: 0
    };
    $scope.paddles = {
        height: paddleHeight,
        width: 20,
        left: {
            y: paddleMaxY/2,
            velocity: 0,
            move: function(direction) {
                $scope.paddles.move('left', direction);
            }
        },
        right: {
            y: paddleMaxY/2,
            velocity: 0,
            move: function(direction) {
                $scope.paddles.move('right', direction);
            }
        },
        move: function(side, direction) {
            this[side].ts = new Date().getTime();
            if (angular.isDefined(intervals[side + direction])) return;
            var sign = ('up' == direction) ? -1 : 1; 
            intervals[side + direction] = $interval(function() {
                // Note: This runs in the window scope because $interval().
                if (1 == sign && paddleMaxY <= $scope.paddles[side].y) return;
                if (-1 == sign && 0 >= $scope.paddles[side].y) return;
                $scope.paddles[side].y += ($scope.settings.paddleSpeed/10) * sign;
                $scope.paddles[side].velocity++;
                $scope.paddles[side].direction = direction;
            }, 5);
        },
        top: function(side) {
            return this[side].y;
        },
        bottom: function(side) {
            return this[side].y + this.height;
        },
        face: function(side) {
            var x = this.width;
            if ('right' == side) {
                x = windowWidth - this.width;
            }
            return x;
        },
        center: function(side) {
            return this[side].y + (this.height/2);
        },
        resetVelocity: function(side) {
            $scope.paddles[side].velocity = 0;
        },
        auto: function(side) {
            if (
                $scope.ball.x < windowHeight/2 && 'left' == side ||
                $scope.ball.x > windowHeight/2 && 'right' == side
            ) {
                var direction = ($scope.ball.y > this.center(side)) ? 'down' : 'up';
                if ('up' == direction) {
                    $scope.cancelInterval(side + 'down');
                } else if ('down' == direction) {
                    $scope.cancelInterval(side + 'up');
                }
                if ( ! angular.isDefined(intervals[side + direction]) ) {
                    this.move(side, direction);
                }
            } else {
                $interval.cancel(intervals[side + direction]);
            }
        }
    };
    $scope.ball = {
        height: 20,
        width: 20,
        x: -50,
        y: Number(windowHeight/2),
        velocities: {
            x: 0,
            y: 0
        },
        color: '#ccc',
        touchesTop: function() {
            return this.y <= 0;
        },
        touchesBottom: function() {
            return windowHeight <= this.y;
        },
        touchesLeft: function() {
            return this.x < 0;
        },
        touchesRight: function() {
            return windowWidth < this.x;
        },
        touchesPaddle: function() {
            var side = this.direction();
            var face = $scope.paddles.face(side);
            var top = $scope.paddles.top(side);
            var bottom = $scope.paddles.bottom(side);
            var sign = ('left' == side) ? 1 : -1;
            if (this.x * sign + face < $scope.paddles.width) {
                if (top < this.y && this.y < bottom) {
                    return true;
                }
            }
            return false;
        },
        isOut: function() {
            return this.touchesLeft() || this.touchesRight();
        },
        whack: function(side) {
            var sign = ('up' == $scope.paddles[side].direction) ? 1 : -1;
            this.velocities.y += ($scope.paddles[side].velocity * sign) * 2;
        },
        direction: function() {
            var direction = 'left';
            if (this.velocities.x < 0) { direction = 'right'; }
            return direction;
        },
        setFinalX: function() {
            this.x = 1;
            if (this.direction() == 'right') {
                this.x = windowWidth - this.width;
            }
        }
    };
    intervals.ball = undefined;
    $scope.startGame = function() {
        $scope.ball.ts = undefined;
        if (angular.isDefined(intervals.ball)) return;
        intervals.ball = $interval(function() {
            if ($scope.settings.numPlayers == 1) {
                $scope.paddles.auto($scope.settings.autoSide);
            }
            var dimensions = {
                x: windowWidth,
                y: windowHeight
            };
            var now = new Date().getTime();
            var elapsed = ($scope.ball.ts || now) - now;

            $scope.ball.ts = now;

            updateBallPosition('x');
            updateBallPosition('y');
            function updateBallPosition(axis) {
                var velocity = $scope.ball.velocities[axis]/1000;
                $scope.ball[axis] += Math.floor(elapsed * velocity);
            }

            updateBallDirection('x', $scope.ball.x);
            updateBallDirection('y', $scope.ball.y);
            function updateBallDirection(axis, value) {
                function bounce(axis, magnitude) {
                    var dimensions = {
                        x: windowWidth,
                        y: windowHeight
                    };
                    var min = 21;
                    var max = dimensions[axis] - 20;
                    if ('max' == magnitude) {
                        $scope.ball[axis] = 2 * max - $scope.ball[axis];
                    }
                    if ('min' == magnitude) {
                        $scope.ball[axis] = 1;
                    }
                    $scope.ball.velocities[axis] *= -1;
                    if ('y' == axis) { $scope.playSound('wallBeep'); }
                    if ('x' == axis) { $scope.playSound('paddleBeep'); }
                }
                if ($scope.ball.touchesTop()) {
                    bounce('y', 'min');
                    return;
                }
                if ($scope.ball.touchesBottom()) {
                    bounce('y', 'max');
                    return;
                }
                if ($scope.ball.touchesPaddle()) {
                    var side = $scope.ball.direction();
                    $scope.ball.whack(side);
                    var magnitude = 'max';
                    if (side == 'left') {
                        magnitude = 'min';
                    }
                    bounce('x', magnitude);
                    return;
                }
                if ($scope.ball.isOut()) {
                    $scope.sideOut = $scope.ball.direction();
                    $scope.scores[$scope.otherSide($scope.sideOut)]++;
                    $scope.ball.setFinalX();
                    $scope.playSound('outBeep');
                    $scope.stopGame();
                    return;
                }
            }
        }, 20);
    };
    $scope.handleEnter = function() {
        if ($scope.modalIsOpen()) {
            $rootScope.$broadcast('modalOkay', '');
            return;
        }
        $scope.serve();
    };
    $scope.handleEsc = function() {
        $scope.stopGame();
        $scope.toggleModal();
    };
    $scope.toggleModal = function() {
        if ($scope.modalIsOpen()) {
            $scope.modal.close();
        }
        else {
            $scope.openModal();
        }
    };
    // This function encapsulates the reach into $scope.modal.closed
    // since there's no accessor for $$state.status. TODO: Hopefully
    // a better way to determine the open/closed state will turn up.
    $scope.modalIsOpen = function() {
        var isOpen = false;
        if (undefined != $scope.modal) {
            if ( ! $scope.modal.closed.$$state.status ) {
                isOpen = true;
            }
        }
        return isOpen;
    };
    $scope.stopGame = function() {
        if (angular.isDefined(intervals.ball)) {
            $scope.cancelInterval('ball');
            intervals.ball = undefined;
        }
    };
    $scope.leftUp = function() {
        $scope.paddles['left'].move('up');
    };
    $scope.leftupCancel = function() {
        $scope.paddles.resetVelocity('left');
    };
    $scope.leftDown = function() {
        $scope.paddles['left'].move('down');
    };
    $scope.leftdownCancel = function() {
        $scope.paddles.resetVelocity('left');
    };
    $scope.rightUp = function() {
        $scope.paddles['right'].move('up');
    };
    $scope.rightupCancel = function() {
        $scope.paddles.resetVelocity('right');
    };
    $scope.rightDown = function() {
        $scope.paddles['right'].move('down');
    };
    $scope.rightdownCancel = function() {
        $scope.paddles.resetVelocity('right');
    };
    $scope.serve = function() {
        var sign = 1;
        if (undefined == $scope.sideOut) {
            var sides = ['left', 'right'];
            $scope.sideOut = sides[Math.floor(Math.random()*10)%2];
        }
        $scope.ball.x = windowWidth;
        $scope.ball.y = $scope.paddles.center('right');
        $scope.ball.velocities.x = $scope.getRandomVelocity('x');
        $scope.ball.velocities.y = $scope.getRandomVelocity('y');
        if ('right' == $scope.sideOut) {
            $scope.ball.x = 1;
            $scope.ball.y = $scope.paddles.center('left');
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
        var side = windowHeight;
        var precision = 3;
        if ('x' == axis) {
            side = windowWidth;
            precision = 2;
        }
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
    $scope.otherSide = function(side) {
        var other = {
            left: 'right',
            right: 'left'
        }
        if (undefined != other[side]) {
            return other[side];
        }
    };
    $scope.cancelInterval = function(interval) {
        if (angular.isDefined(interval) && undefined != intervals[interval]) {
            $interval.cancel(intervals[interval]);
            if (angular.isFunction($scope[interval + 'Cancel'])) {
                $scope[interval + 'Cancel']();
            }
            intervals[interval] = undefined;
        }
    };
    angular.element(document).on('keydown', function(e) {
        if (angular.isFunction($scope[keyMap[e.keyCode]])) {
            $scope[keyMap[e.keyCode]]();
        }
    });
    angular.element(document).on('keyup', function(e) {
        if (angular.isFunction($scope[keyMap[e.keyCode]])) {
            $scope.cancelInterval(keyMap[e.keyCode].toLowerCase());
        }
    });
}])
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
})
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
.directive('paddle', ['$swipe', function($swipe) {
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
$swipe.bind(element, {
    start: function(coords) {
        console.log(coords);
        alert('touch');
    }
});
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
}])
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
;
