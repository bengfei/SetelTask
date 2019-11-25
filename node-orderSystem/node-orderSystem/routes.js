var router = require('express').Router();
var orderController = require('./controller/orderController');


router.get('/', function (req, res) {  
  res.send('Welcome, please place your Order');  
})

router.get('/order',orderController.startOrder);

router.get('/orderList', orderController.ListOrder);

router.get('/orderCancel', orderController.cancelOrder);

module.exports = router;
