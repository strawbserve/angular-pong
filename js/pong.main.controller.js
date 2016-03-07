angular
.module('pongApp')
.controller('PongController', [
'$rootScope', '$scope', '$window', '$interval', '$uibModal', 'Data',
function($rootScope, $scope, $window, $interval, $uibModal, Data) {

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

    $scope.settings = Data.get('settings');

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
            Data.save('settings', settings);
        }, function () {
            // do nothing for now . . .
        });

        $scope.modal = modalInstance;;
    };

    if ($scope.settings.showDirections) {
        $scope.openModal();
    }

    $scope.toggleAnimation = function () {
          $scope.animationsEnabled = !$scope.animationsEnabled;
    };

    intervals.ball = undefined;

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
                // This runs in the window scope because $interval().
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
    // Note: References to `$scope.ball` as opposed to `this` inside
    // `$scope.ball` are because the sccope changes to `Window` when
    // called from within `interval()`.
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
        move: function() {
            $scope.ball.ts = undefined;
            if (angular.isDefined(intervals.ball)) return;
            intervals.ball = $interval(function() {
                // This runs in the window scope because $interval().
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

                $scope.ball.updatePosition('x', elapsed);
                $scope.ball.updatePosition('y', elapsed);

                $scope.ball.updateDirection('x', $scope.ball.x);
                $scope.ball.updateDirection('y', $scope.ball.y);

            }, 20);
        },
        updatePosition: function(axis, elapsed) {
            var velocity = this.velocities[axis]/1000;
            this[axis] += Math.floor(elapsed * velocity);
        },
        updateDirection: function(axis, value) {
            if (this.touchesTop()) {
                this.bounce('y', 'min');
                return;
            }
            if (this.touchesBottom()) {
                this.bounce('y', 'max');
                return;
            }
            if (this.touchesPaddle()) {
                var side = this.direction();
                this.whack(side);
                var magnitude = 'max';
                if (side == 'left') {
                    magnitude = 'min';
                }
                this.bounce('x', magnitude);
                return;
            }
            if (this.isOut()) {
                $scope.sideOut = this.direction();
                $scope.scores[$scope.otherSide($scope.sideOut)]++;
                this.setFinalX();
                $scope.playSound('outBeep');
                $scope.stopGame();
                return;
            }
        },
        bounce: function(axis, magnitude) {
            var dimensions = {
                x: windowWidth,
                y: windowHeight
            };
            var min = 21;
            var max = dimensions[axis] - 20;
            if ('max' == magnitude) {
                this[axis] = 2 * max - this[axis];
            }
            if ('min' == magnitude) {
                this[axis] = 1;
            }
            this.velocities[axis] *= -1;
            if ('y' == axis) { $scope.playSound('wallBeep'); }
            if ('x' == axis) { $scope.playSound('paddleBeep'); }
        },
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
        $scope.ball.move();
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
