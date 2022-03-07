var products = require('./catalog/products.js');
var inventory = require('./inventory/inventory.js');
const cors = require('cors');

const express = require('express')
const app = express();

const PRODUCT_DETAIL_END_POINT= "/products/detail/:productID/" ;
const PRODUCTS_LIST_END_POINT= "/products/:pageNumber/" ;
const PURCHASE_PRODUCT_END_POINT= "/purchase/product/" ;

const FEEDING_IN_PRODUCS_END_POINT= "/products/load/" ;
const FEEDING_IN_STOCK_END_POINT= "/inventory/load/" ;

app.use(express.json());
app.use(cors({
  origin: '*'
}));

app.get(FEEDING_IN_PRODUCS_END_POINT, (req, res) => {
  products.loadProducts();
  res.send('feeding products into our MongoDB system ');
});

app.get(FEEDING_IN_STOCK_END_POINT, (req, res) => {
  inventory.loadInventory();
  res.send('feeding stocks into our MongoDB system ');
});

app.get(PRODUCTS_LIST_END_POINT, (req, res) => {
  const pageNumer = req.params.pageNumber ;
  console.log(`List Products has been called with pageNumer :  ` + pageNumer);
  products.getAllProducts(pageNumer).then( (data) => {
    res.json(data);
  }) ; 
});

app.get(PRODUCT_DETAIL_END_POINT, (req, res) => {
  const productID = req.params.productID ;
  products.getProductDetails(productID).then( (data) => {
    if (data === null ){
        res.sendStatus(404);
     }else {
         res.json(data);
        }
  }); 
});

app.post(PURCHASE_PRODUCT_END_POINT, (req, res) => {

  const purchasePayload = JSON.stringify(req.body);

  const productID = JSON.parse(purchasePayload).productID ;
  const qty = JSON.parse(purchasePayload).quantity ;

  console.log("Purchase product has been called with ProductID : " + productID);
  console.log("Purchase product has been called with quanity : " + qty );

  inventory.purchaseProduct(productID,qty).then(
    (data) => {
      if (data === true){
        res.sendStatus(200); 
      }else{
        res.sendStatus(409);
      }
    }
  ).
  catch(
    (error) => {
      console.error("Failed to purchase the product " + error);
      res.sendStatus(409); // initially return a conflict error code 
    }
  );
  
});

const port = 2001;
app.listen(port, () => {
  console.log(`WareHouse backend is listening on port ${port}!`)
});