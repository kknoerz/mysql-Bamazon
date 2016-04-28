var mysql = require('mysql');
var prompt = require('prompt');
var promptAdd = require('prompt');
var promptNew = require('prompt');
var schema = {
   properties: {
     option: {
       type: 'integer',
       pattern: /^(?:([1-4])(?!.*\1)){1}$/,
       message: 'Select the number associated with what action you are trying to take. Ex: 2 If you want to view LOW INVENTORY ',
       required: true,
       description: "Type [1] View Products for Sale,  [2] View Low Inventory,  [3] Add to Inventory,  [4] Add New Product"
     }
   }
 };
 var schemaAdd = {
   properties: {
     itemID: {
       type: 'integer',
       pattern: /^[1-9]|10$/,
       message: 'Select the ItemID associated with the item you would like add inventory to. Ex: 6',
       required: true,
       description: "Select the ItemID associated with the item you would like add inventory to."
     },
     quantity:{
       type: 'integer',
       pattern: /(\d+(.\d+)?-\d+(.\d+)?)/,
       message: 'Please select the quantity of the item you would like to purchase. Ex: 32',
       required: true,
       description: 'Please select the quantity of the item you would like to purchase'
     }
   }
 }
 var schemaNew = {
   properties: {
     productName:{
       type: 'string',
       pattern: /\w+$/,
       message: 'What is the name of the new product that you want to order? EX: Chicken',
       required: true,
       description: 'What is the name of the new product that you want to order?'
     },
     departmentName:{
       type: 'string',
       pattern: /\w+$/,
       message: 'What is the name of the department that you want to put the item? EX: Home Goods',
       required: true,
       description: 'What is the name of the department that you want to put the item?'
     },
     price:{
       type: 'number',
       pattern: /^\$?[0-9]+\.?[0-9]?[0-9]?$/,
       message: 'What is the price point of the new item? EX: 25.00 or 25',
       required: true,
       description: 'What is the price point of the new item? Don\'t use ($)'
     },
     stockQuantity:{
       type: 'integer',
       pattern: /^([1-9][0-9]|[1-9][0-9][0-9]$)/,
       message: 'How many items do you want to order? Ex: 12',
       required: true,
       description: 'How many items do you want to order?'
     }
   }
 }

prompt.start();

var connection = mysql.createConnection({
  host      : 'localhost',
  user      : 'root',
  database  : 'Bamazon'
});

connection.connect(function(err){
  if(err){
    console.log('error connecting: '+err.stack);
    return;
  }
  console.log('Welcome manager.')
  prompt.get(schema, function(err, result){
    if(err) throw err;

    if(result.option == 1){
      connection.query('select * from products;', function(err, all){
        if(err) throw err;
        console.log(all);
        console.log('Above is a list of all items available for purchase.');
      });
    }else if(result.option == 2){
      connection.query('select * from products WHERE StockQuantity < 5;', function(err, less){
        if(err) throw err;
        console.log(less);
        console.log('Above is a list of all items with less than 5 in inventory.');
      });
    }else if(result.option == 3){
      connection.query('select ItemID, ProductName, StockQuantity from products;', function(err, all){
        if(err) throw err;
        console.log(all)
        console.log('You want to add items, how many do you want to add')
        promptAdd.get(schemaAdd, function(err, result){
          var updatedQty = (result.quantity) + (all[result.itemID - 1].StockQuantity);
          connection.query('UPDATE products SET StockQuantity = '+updatedQty+' WHERE ItemID ='+result.itemID, function(err, res){
            connection.query('select ItemID, ProductName, StockQuantity from products WHERE ItemID ='+result.itemID, function(err, all){
              console.log('Quantity Updated!');
              console.log(all);
            });
          });
        });
      });
    }else if(result.option == 4){
      promptNew.get(schemaNew, function(err, result){
        connection.query('INSERT INTO products(ProductName, DepartmentName, Price, StockQuantity)VALUES("'+result.productName+'", "'+result.departmentName+'", "'+result.price+'", "'+result.stockQuantity+'");', function(err, all){
          if(err) throw err;
          console.log(all);
          connection.query('select * from products;', function(err, all){
            console.log(all);
          });
        });
      });
    }else{
      console.log('BAD! You chose: '+result.option);
    }


  });
});
