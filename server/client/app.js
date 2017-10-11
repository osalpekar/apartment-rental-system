var app = angular.module('rental-app');

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/app/users', {
        controller: 'tenantController',
        template: 'views/tenants.html'
    })
    .when('/app/psql/users', {
        controller: 'tenantController',
        template: 'views/tenants.html'
    })
    .when('/app/mysql/users', {
        controller: 'tenantController',
        template: 'views/tenants.html'
    })
    .otherwise({
        redirectTo: '/app/users'
    });
}]);
