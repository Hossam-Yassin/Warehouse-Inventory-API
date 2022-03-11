const {MongoClient} = require('mongodb');

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);

const ProductsPerPage = 5;
const outOfRangeStockValue = 10000000000 ; // This is imaginal number that not practical to have as stocks for any product

exports.insertProducts = async function (docs) {
  
  try {
    await client.connect();
    const database = client.db("WareHouse");
    const products = database.collection("Products");

    // this option prevents additional documents from being inserted if one fails by seting ordered = true
    const options = { ordered: false };
    
    //Setting ID field to the docmuent , MongoDB related field
    for(index in docs){
      docs[index]._id=docs[index].id;
    }

    await products.insertMany( docs, options);
    
  }catch(err){
    console.error(err);
  }
  finally {
    client.close();
  }
}

/**
 * This method is feeding the DB with the stock availability of the articles in the warehouse , 
 * It is reading json file and insert it to the DB. 
 * 
 * //TODO : This method should increment the stocks in the DB not replacing as it is implemented now so 
 * initially , we can fire a batch/bulk of transaction for each article by incrementing the stock with 
 * the value in the json file.
 */
exports.insertInventoryStock = async function (docs) {
  
  try {
    await client.connect();
    const database = client.db("WareHouse");
    const inventory = database.collection("Stock");

    // this option prevents additional documents from being inserted if one fails by seting ordered = true
    const options = { ordered: false };

    //Setting ID field to the docmuent , MongoDB related field
    for(index in docs){
      docs[index]._id=docs[index].art_id;
    }
    await inventory.insertMany(docs, options);

  }catch(err){
    console.error(err);
  }
  finally {
    client.close();
  }
}

exports.getProductDetails = async function (productID){
  try {
    await client.connect();
    const database = client.db("WareHouse");
    const products = database.collection("Products");

    const productDetailsDoc = await products.findOne({_id : productID});
    if(productDetailsDoc !== null ){
      console.log( 'DataAccess : Product Name is : ${productDetailsDoc.name} and ID : ' + productDetailsDoc.name );
    }
    return productDetailsDoc;

  } catch(err){
    console.error(err);
  }finally {
    client.close();
  }
};

exports.getAllProducts = async function (pageNumber){
  console.log(`DataAccess : getAllProducts method has been called with PageNumber : ` + pageNumber);
  try {
    await client.connect();
    const database = client.db("WareHouse");
    const products = database.collection("Products");

    const result = await products.find({}).skip(ProductsPerPage*(pageNumber-1)).limit(ProductsPerPage).toArray(); 
    console.log( 'DataAccess : Product list is : ' + JSON.stringify(result) );

    return result;
    
  } catch(err){
    console.error(err);
  }finally {
     await client.close();
  }
};

exports.purchaseProduct = async function (productID , qty){
  
  try {
    
    await client.connect();
    const database = client.db("WareHouse");
    const products = database.collection("Products");

    let productDetails = await products.findOne({_id : productID});

    const StockStore = database.collection("Stock");
    let inStock = true; 
    
    //Retrieve all composed article in the purchased product
    for (index in productDetails.contain_articles ) { 
      let articleStock = await StockStore.findOne({_id : productDetails.contain_articles[index].art_id});
      if(articleStock !== null){
          if(Number.parseInt(qty)* Number.parseInt(productDetails.contain_articles[index].amount_of) >  Number.parseInt(articleStock.stock) ) {
            console.log("Article is out of stock : " + productDetails.contain_articles[index].amount_of);
            inStock = false;
          }
      }
    }
    
    //This need to be made in transaction 
    if(inStock === true){
      for (index in productDetails.contain_articles) { 
         await StockStore.updateOne({_id : productDetails.contain_articles[index].art_id} , 
          { $inc: { stock: -1 * Number.parseInt(qty)* Number.parseInt(productDetails.contain_articles[index].amount_of) } } );
      }
    }

    console.log("DataAccess : Stock Availability :  " + inStock);
    return inStock ;
    
  } catch(err){
    console.error(err);
  }finally {
    client.close();
  }
};

/**
 * This method will return a json object with the available 
 * stock of the quered product.
 */
exports.checkStockAvailability = async function (productID){
  
  try {
    await client.connect();
    const database = client.db("WareHouse");
    const products = database.collection("Products");

    let productDetails = await products.findOne({_id : productID});

    const StockStore = database.collection("Stock");
    let productAvailableStocks =outOfRangeStockValue ; 

    //Retrieve all composed article in the purchased product
    for (index in productDetails.contain_articles ) { 
      let articleStock = await StockStore.findOne({_id : productDetails.contain_articles[index].art_id});
      if(articleStock !== null){
        let articleAvailableStocks = Number.parseInt(articleStock.stock) / Number.parseInt(productDetails.contain_articles[index].amount_of) ;
        if(articleAvailableStocks >= 1){
            //assign the least stock available in the contained articles in the product
            if (articleAvailableStocks < productAvailableStocks) { //This condition will always run for the first iteration
              productAvailableStocks = articleAvailableStocks;
            }  
        }else{
          //end the loop and return out of stock value 
          console.log("DataAccess : one of the included articles is out of stock " );
          return 0;
        }
      }
    }

    console.log("DataAccess : Stock Availability :  " + productAvailableStocks);
    return productAvailableStocks;

  } catch(err){
    console.error(err);
    productAvailableStocks = 0;
    return productAvailableStocks;
  }finally {
     await client.close();
  }
};

/* 
  This is a function that require MongoDB to be
working in replica mode so transaction management is 
handled properly .

//TODO : not tested yet so do not use. 
**/
exports.purchaseProductXYZ = async function (productID , qty){
  
  await client.connect();
  // Define options to use for the transaction
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' }
  };

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {

      console.log(`Session has been started`);
      
      const productsCatalog = client.db("WareHouse").collection("Products");
      const InventoryStocks = client.db("WareHouse").collection("Stocks");

      // Important:: You must pass the session to the operations
      await productsCatalog.insertOne({ abc: 1 }, { session });
      await InventoryStocks.insertOne({ xyz: 999 }, { session });
      
    }, transactionOptions);
  } finally {
    await session.endSession();
    await client.close();
    console.log(`Session has ended`);
  }
};