const fs = require('fs');
const path = require('path');
const dataAccess = require('../data/dataAccess.js');

/**
 * this method will deduct the quantity of the product from our system
 */
exports.purchaseProduct = async function (productID , qty){
  console.log('purchaseProduct has been Called ');
  if (isNaN(qty)){
    console.error('Incorrect quantity , use only number to be able to proceed ');
    pageNumber = PageOne ;
  }else{
    await dataAccess.purchaseProduct(productID,qty).then(
      (data) => {
        return data;
      }
    );
  }
};

/**
 * This method will load the articles in stock database from a file.
 */
exports.loadInventory = async function (){
  console.log('loadInventory has been Called ');
  let fileContent = fs.readFileSync(path.resolve(__dirname, 'inventory.json'));
  let json = JSON.parse(fileContent);

  for (key in json) {
    if(key==='inventory'){ 
      if (json.hasOwnProperty(key)) {
        console.log("Fetched Articles Count : " + json[key].length);
        await dataAccess.insertInventoryStock(json[key]);
      }
    } 
  }
  console.log('loadInventory has been Called ');
};