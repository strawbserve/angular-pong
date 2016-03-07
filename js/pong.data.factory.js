angular
.module('pongApp')
.factory('Data', function() {
    return {
        localStoragePrefix: 'angular-pong',
        settings: {
            active: false,
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
            }
        },
        get: function(property, value) {
            if (false === this[property].active) {
                this[property].active = JSON.parse(
                    localStorage.getItem(
                        this.localStoragePrefix + '.' + property
                    )
                );
                if (null == this[property].active) {
                    this[property].active = this[property].default;
                }
            }
            if (undefined != value) {
                return this.active[property][value];
            } else {
                return this[property].active;
            }
        },
        save: function(property, data) {
            this[property].active = data;
            localStorage.setItem(
                this.localStoragePrefix + '.' + property,
                JSON.stringify(data)
            );
        },
        reset: function(property) {
            this[property].active = this[property].default;
            this.save(property, this[property].active);
        },
        clearLocal: function(property) {
            if (undefined != property) {
                localStorage.removeItem(this.localStoragePrefix + '.' + property);
            } else {
                for (item in localStorage) {
                    localStorage.removeItem(item);
                }
            }
        }
    }
})
