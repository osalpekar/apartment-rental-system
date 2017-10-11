var app = angular.module('tenant-app');

app.controller('tenantController', ['$scope', '$http', function ($scope, $http) {

    $scope.tenantList = {};
    $scope.str = 'aaaa';
    $scope.newData = {
        text: $scope.str
    };

    $http.get('/app/psql/users').then(function (response) {
        $scope.tenantList = response;
    });

    $http.post('/app/psql/users', $scope.newData).then(function (response) {
        $scope.tenantList = response;
        $scope.str = ((parseInt($scope.str, 36)+1).toString(36)).replace(/0/g,'a'); 
        $scope.newData = {
            text: $scope.str
        };
    });

    $http.get('/app/mysql/users').then(function (response) {
        $scope.tenantList = response;
    });

    $http.post('/app/mysql/users', $scope.newData).then(function (response) {
        $scope.tenantList = response;
        $scope.str = ((parseInt($scope.str, 36)+1).toString(36)).replace(/0/g,'a'); 
        $scope.newData = {
            text: $scope.str
        };
    });

}]);
