var app = angular.module('tenant-app');

app.controller('tenantController', ['$scope', '$http', function ($scope, $http) {

    $scope.tenantList = {};
    $scope.id = 0;
    $scope.str = 'aaaa';
    $scope.newData = {
        id: $scope.id,
        text: $scope.str
    };

    $http.get('/app/psql/users').then(function (response) {
        $scope.tenantList = response;
    });

    $http.post('/app/psql/users', $scope.newData).then(function (response) {
        $scope.tenantList = response;
        $scope.id += 1;
        $scope.str = ((parseInt($scope.str, 36)+1).toString(36)).replace(/0/g,'a'); 
        $scope.newData = {
            id: $scope.id,
            text: $scope.str
        };
    });

}]);
