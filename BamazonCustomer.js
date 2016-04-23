var mysql = require('mysql');
var promptLogin = require('prompt');
var promptReturn = require('prompt');
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
       type: 'integer',
       pattern: /\b((?:\d{1,3})(?:([,. ']?)\d{3})?(?:\2\d{3})*)(?:(?:|(?!\2))([,.])(\d+))?\b/,
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

 var money = 0;
 var want = 0;
 var have = 0;
 var itemName = '';
 var newQuantity = 0;

promptLogin.start();
promptReturn.start();

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
  console.log('connected as id '+connection.threadId);
  connection.query('select * from products', function(err, all){
    if(err) throw err;
    console.log(all)
    // debugger;
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
        if(newQuantity >= 0 && money > 0){
          console.log('We have enought '+res[0].ProductName+' in stock.');
          money = money - totalPrice;
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
          returnShopper();
        }else if(want>have && have !=0){
          console.log('We only have '+have+' in stock.');
          returnShopper();
        }else{
          return false
        }
      });
    });
  });

  var returnShopper = function(){
    connection.query('select * from products', function(err, all){
      if(err) throw err;
      console.log(all);
      console.log('Above is a list of all items available for purchase.');
      console.log('You bought '+want+' '+productName+'s for a total of '+totalPrice);
      console.log('This is how much money you have left: $'+money);
      promptReturn.get(schemaReturn, function(err, result){
        if(err) throw err;
        connection.query('SELECT ItemID, ProductName, DepartmentName, Price, StockQuantity FROM products WHERE ItemID ='+result.itemID, function(err, res){
          console.log(res);
          want = result.quantity;
          have = res[0].StockQuantity;
          totalPrice = want*(res[0].Price);
          newQuantity = have - want;
          productName = res[0].ProductName;
          if(newQuantity > 0 && money > 0){
            console.log('We have enought '+res[0].ProductName+' in stock.');
            money = money - totalPrice;
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
            return false
          }
        });
      });
    });
  }
});