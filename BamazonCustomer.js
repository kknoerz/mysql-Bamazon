var mysql = require('mysql');
var promptLogin = require('prompt');
var promptReturn = require('prompt');
var promptQuit = require('prompt');
var schemaLogin = {
   properties: {
     itemID: {
       type: 'integer',
       pattern: /^[1-9]|10$/,
       message: 'Select the ItemID associated with the item you would like purchase. Ex: 6',
       required: true,
       description: "What is is ID of the item you would like to purchase?"
     },
     quantity:{
       type: 'integer',
       pattern: /^(0?[1-9]|[1-9][0-9])$/,
       message: 'Please select the quantity of the item you would like to purchase. Ex: 32',
       required: true,
       description: 'Please select the quantity of the item you would like to purchase'
     },
     money:{
       type: 'number',
       pattern: /^\$?[1-9]+\.?[0-9]?[1-9]?$/,
       message: 'How much money is in your budget? Ex: 450, NOT $450',
       required: true,
       description: 'How much money is in your budget? '
     }
   }
 };
 var schemaReturn = {
    properties: {
      itemID: {
        type: 'integer',
        pattern: /^[1-9]|10$/,
        message: 'Select the ItemID associated with the item you would like purchase. Ex: 6',
        required: true,
        description: "What is is ID of the item you would like to purchase?"
      },
      quantity:{
        type: 'integer',
        pattern: /^(0?[1-9]|[1-9][0-9])$/,
        message: 'Please select the quantity of the item you would like to purchase. Ex: 32',
        required: true,
        description: 'Please select the quantity of the item you would like to purchase'
      }
    }
  };
  var schemaQuit = {
    properties: {
      quit:{
        type: 'string',
        pattern: /^(?:yes\b|Yes\b|no\b|No\b|Y\b|N\b|y\b|n\b)/,
        message: 'Would you like to keep shopping? Ex: yes no',
        required: true,
        description: 'Would you like to keep shopping? yes/no'
      }
    }
  };

 var money = 0;
 var want = 0;
 var have = 0;
 var itemName = '';
 var newQuantity = 0;
 var cart = [];

promptLogin.start();
promptReturn.start();
promptQuit.start();

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
  connection.query('select * from products', function(err, all){
    if(err) throw err;
    console.log(all)
    console.log('Above is a list of all items available for purchase.');
    promptLogin.get(schemaLogin, function(err, result){
      if(err) throw err;
      money = result.money;
      connection.query('SELECT ItemID, ProductName, DepartmentName, Price, StockQuantity FROM products WHERE ItemID ='+result.itemID, function(err, res){
        console.log(res);
        want = result.quantity;
        have = res[0].StockQuantity;
        totalPrice = want*(res[0].Price);
        newQuantity = have - want;
        productName = res[0].ProductName;

        if(newQuantity >= 0 && money > 0 && totalPrice < money){
          money = money - totalPrice;
          money = parseFloat(money).toFixed(2);
          var inCart = {
            [productName]:want
          }
          cart.push(inCart);
          connection.query('UPDATE products SET StockQuantity = '+newQuantity+' WHERE ItemID ='+result.itemID, function(err, res){
            if (err) throw err;
            // console.log(res);
            connection.query('SELECT ItemID, ProductName, DepartmentName, Price, StockQuantity FROM products WHERE ItemID ='+result.itemID, function(err, res){
              console.log(res);
              returnShopper();
            });
          });
        }else if(totalPrice>money){
          console.log('You don\'t have enough money for that many!');
          process.exit();
        }else if(want>have && have !=0){
          console.log('We only have '+have+' in stock.');
          returnShopper();
        }else{
          console.log(err);
          console.log('IDK what happened..')
          process.exit();
        }
      });
    });
  });

  var returnShopper = function(){
    connection.query('select * from products', function(err, all){
      if(err) throw err;
      console.log(all);
      console.log('Above is a list of all items available for purchase.');
      console.log('You bought '+want+' '+productName+'(s) for a total of '+totalPrice);
      console.log('This is how much money you have left: $'+money);
      console.log('Here are all the items in your cart: ', cart);
      promptQuit.get(schemaQuit, function(err, result){
        if (err) throw err;

        if(result.quit == 'no'){
          process.exit();
          console.log('Thanks for shopping!');
        }
        promptReturn.get(schemaReturn, function(err, result){
          if(err) throw err;

          connection.query('SELECT ItemID, ProductName, DepartmentName, Price, StockQuantity FROM products WHERE ItemID ='+result.itemID, function(err, res){
            console.log(res);
            want = result.quantity;
            have = res[0].StockQuantity;
            totalPrice = want*(res[0].Price);
            newQuantity = have - want;
            productName = res[0].ProductName;
            if(newQuantity > 0 && money > 0 && totalPrice < money){
              console.log('We have enought '+res[0].ProductName+' in stock.');
              money = money - totalPrice;
              money = parseFloat(money).toFixed(2);
              var inCart = {
                [productName]:want
              }
              cart.push(inCart);
              connection.query('UPDATE products SET StockQuantity = '+newQuantity+' WHERE ItemID ='+result.itemID, function(err, res){
                if (err) throw err;
                // console.log(res);
                connection.query('SELECT ItemID, ProductName, DepartmentName, Price, StockQuantity FROM products WHERE ItemID ='+result.itemID, function(err, res){
                  console.log(res);
                  returnShopper();
                });
              });
            }else if(totalPrice>money){
              console.log('You don\'t have enough money for that many! Choose less!');
              returnShopper();
            }else if(want>have && have !=0){
              console.log('We only have '+have+' in stock.');
              returnShopper();
            }else if(money = 0){
              console.log('You don\'t have any money left!')
              process.exit();
            }
          });
        });
      });
    });
  }
});
