const fs = require('fs');
const path = require('path');
const dataAccess = require('../data/dataAccess.js');

const PageOne = 1;

/**
 * This method will load products from a file into our product catalog data store.
 */
exports.loadProducts = function (){
  console.log('loadProducts has been Called ');

  let fileContent = fs.readFileSync(path.resolve(__dirname, 'products.json'));
  let json = JSON.parse(fileContent);

  for (key in json) {
    if(key==='products'){ 
      if (json.hasOwnProperty(key)) {
        console.log("Fetched Products size : " + json[key].length);
        dataAccess.insertProducts(json[key]);
      }
    } 
  }
  console.log('loadProducts has been completed ');
};

/**
 * get the product details using the product ID as parameter
 */
exports.getProductDetails = async function (productID){
  console.log('getProdcutDetails has been Called ');
  let productDetails = await dataAccess.getProductDetails(productID);
  console.log('Product has been find  ' + productDetails);
  console.log('getProdcutDetails has been completed ');
  return productDetails;
};

/**
 * get all products in the catalog , 
 * due to the expected large number of products in our data base , 
 * we will get the results in pages , every page contains 25 products 
 */
exports.getAllProducts = async function (pageNumber) {
  console.log('getAllProdcut has been Called ');
  if (isNaN(pageNumber)) {
    console.error('Incorrect PageNumber , The first page being used as default value ');
    pageNumber = PageOne;
  }
  let result = await dataAccess.getAllProducts(pageNumber) ;
  return result;
};