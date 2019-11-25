var router = require('express').Router();
var moment = require('moment');


router.get('/payment', function (req, res) {
  
  var dt = moment().unix();
  var state = '';
  if(dt%2 == 0){
  	state = 'confirmed';
  } else {
  	state = 'declined';
  }
  console.log('Order: ', req.query.orderno,' state ',state);
  res.send('{"response":"'+state+'"}');
})

module.exports = router;
