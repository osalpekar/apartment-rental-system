var app = angular.module('tenant-app');

app.controller('tenantController', ['$scope', '$http', function ($scope, $http) {
    $http.get('/apps/users').then(function (response) {
        $scope.tenantList = response;
    });
}]);
