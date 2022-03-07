const {MongoClient} = require('mongodb');

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);

const ProductsPerPage = 5;

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

    const result = await products.insertMany( docs, options);
  } finally {
    await client.close();
  }
}

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
      //docs[index].stock=Number.parseInt(docs[index].stock);
    }
    const result = await inventory.insertMany(docs, options);

    console.log(`${result.insertedCount} products were inserted into the warehouse`);
  } finally {
    await client.close();
  }
}

exports.getProductDetails = async function (productID){
  try {
    await client.connect();
    const database = client.db("WareHouse");
    const products = database.collection("Products");

    const productDetailsDoc = await products.findOne({_id : productID});
    if(productDetailsDoc !== null ){
      console.log( 'Product Name is : ${productDetailsDoc.name} and ID : ' + productDetailsDoc.name );
    }
    return productDetailsDoc;

  } finally {
    //await client.close();
  }
};

exports.getAllProducts = async function (pageNumber){
  console.log(`getAllProducts method has been called with PageNumber : ` + pageNumber);
  try {
    await client.connect();
    const database = client.db("WareHouse");
    const products = database.collection("Products");

    const result = await products.find({}).skip(ProductsPerPage*(pageNumber-1)).limit(ProductsPerPage).toArray(); 
    console.log( 'Product list is : ' + JSON.stringify(result) );

    return result;
    
  } finally {
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
    
  } finally {
     //await client.close();
  }
};

/**
 * This method will return the available stock of the product
 */
exports.checkStockAvailability = async function (productID){
  
  try {
    
    await client.connect();
    const database = client.db("WareHouse");
    const products = database.collection("Products");

    let productDetails = await products.findOne({_id : productID});

    const StockStore = database.collection("Stock");
    let productAvailableStocks =1000000000 ; // imaginal number

    //Retrieve all composed article in the purchased product
    for (index in productDetails.contain_articles ) { 
      let articleStock = await StockStore.findOne({_id : productDetails.contain_articles[index].art_id});
      if(articleStock !== null){
        let articleAvailableStocks = Number.parseInt(articleStock.stock) / Number.parseInt(productDetails.contain_articles[index].amount_of) ;
        if(articleAvailableStocks < productAvailableStocks){
           productAvailableStocks = articleAvailableStocks;
        }
      }
    }

    console.log("DataAccess : Stock Availability :  " + productAvailableStocks);
    return productAvailableStocks;

  } finally {
     await client.close();
  }
};

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