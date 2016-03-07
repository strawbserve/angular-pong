angular
.module('pongApp')
.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, Data) {

    // The JSON calls get us a copy of the settings so we can cancel.
    $scope.settings = JSON.parse(JSON.stringify(Data.get('settings')));

    $scope.$on('modalOkay', function(event, arg) {
        $scope.ok();
    });

    $scope.clearLocalSettings = function() {
        Data.clearLocal('settings');
    };

    $scope.resetSettings = function() {
        Data.reset('settings');
        $scope.settings = Data.get('settings');
    };

    $scope.ok = function() {
        $uibModalInstance.close($scope.settings);
    };

    $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };

});
