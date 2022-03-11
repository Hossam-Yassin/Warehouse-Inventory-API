# Warehouse-Inventory-API
API project for managing warehouse inventory for a retailer

This is a project that expose REST services to manage warehouse like : 
1- searching for products.
2- checking the stock availability of the products .
3- Feeding the warehouse store with products and their stocks.
4- Updating the product stock when purchased successfully.

The main technolgoy stack used in this project is : 
1- NodeJS : The main framework that run/host the business logic for all services 
2- Express : Routing and mapping resources to endpoints 
3- MongoDB : Data store for both Products and Stocks.

How to run it : 

First , Install or use a docker image for a mongoDB instance that run in port 27017 , then create a new Database called ('Warehouse') and add to collections to this database as shown in the attached MongoDB image in the doc folder

Second , Pull the project from the repository and ensure to run 'npm install' command to install all dependencies in the package.json 

Finally , Run the 'node index.js' command to start your server 

You can test the APIs by using postman collections.
