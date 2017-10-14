# Apartment Rental System

Application that allows apartment managers to track tenants. Built to test
throttlebot system from Berkeley NetSys Lab.


# To Run

First, navigate to `./quilt-spec/` and run `npm install`. Then run quilt in a
separate tab with `quilt daemon`. Run the quilt spec with `quilt run
./main.js`. Use `quilt ps` to find the IP Address of the machine the web server
is running on.

# Routes

The following routes are defined in the server:
1. ip_address:3000/app/psql/users - read/write to postgres database instance
1. ip_address:3000/app/mysql/users - read/write to mySQL database instance
1. ip_address:3000/app/users - welcome message for the app 
1. ip_address:3000/app/elastic/count - count of items in elastic index


Use Apache JMeter for load testing using the endpoints defined above. The first
2 endpoints have GET and POST requests defined whereas the last two only have a
GET request.
