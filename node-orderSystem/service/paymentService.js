var EventEmitter = require('events').EventEmitter;
var request = require('request');
var util = require('util');
var moment = require('moment');
var config = require('../config/config');


var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://' + config.mongoserver;


function PaymentService() {
	EventEmitter.call(this);

	this.Ptag = null;
	this.dbname = '';
	this.dbcol = '';
	this.dbobj = '';
	this.orders = [];
	
	this.on('callPayments', this.callPayments.bind(this));
	this.on('emitData', this._doData.bind(this));
	this.on('updateData', this.updateOrder.bind(this));
	this.on('deliveredOrder', this.deliveredOrder.bind(this));
}
util.inherits(PaymentService, EventEmitter);

PaymentService.prototype.init = function(dbname, dbcol, dbobj) {
	
	this.createOrder(dbname, dbcol, dbobj);
	this.dbname = dbname;
	this.dbcol = dbcol;
	this.dbobj = dbobj;
};


PaymentService.prototype.callPayments = function(dbobj) {
	console.log('sent request to payment');
	var self = this;
	console.log('callpayment:'+dbobj.orderno);
	console.log('callpayment:'+dbobj.username);
	console.log('callpayment:'+dbobj.amount);
	request({
		method: 'GET',
		proxy: false,
		timeout: 30000,
		url: 'http://'+config.paymentServerIp + ':' + config.paymentport + '/payment?orderno=' + dbobj.orderno + '&timestamp=' + dbobj.created
			+ '&username=' + dbobj.username + '&amount=' + dbobj.amount,
	}, function (error, response, body) {
		self.emit('emitData', error, response, body);
	});
};



PaymentService.prototype._doData = function(err, response, body) {
	console.log('processing data...');
	var strErr = '', self = this;
	
		if (err) {
			strErr = String(err);
			console.log('Post error', strErr);			
		} else if (response && response.statusCode === 200) {
			try {
				var data = JSON.parse(body);
				var dt = moment().unix();
				if (data.response == 'confirmed') {
					//update mongo to confirmed
					console.log('co:' + data.response);
					
					self.emit('updateData', 'confirmed');
					
				} else if (data.response == 'declined') {
					//update mongo to cancelled
					console.log('de:' + data.response);
					
					self.emit('updateData', 'cancelled');
				} else {
					var error = 'Error response state:' + data.response;
					console.log(error);					
				}
			} catch (e) {
				strErr = String(e);
				console.log('Post payment response error %s %s', strErr, body);			
			}	
		}
};

PaymentService.prototype.createOrder = function(dbname, dbcol, dbobj) {
	console.log('createdOdr:'+dbname);
	var self = this;
	MongoClient.connect(url, {useUnifiedTopology: true, 
	   useNewUrlParser: true}, function(err, client) {

		if (err) throw err;
		console.log("Successfully connected to server");
		const db = client.db(dbname);
		
	  db.collection(dbcol).insertOne(dbobj, function(err, res) {
	    if (err) throw err;
	    console.log("1 document inserted");
	    client.close();    
	  });
	});
self.emit('callPayments', dbobj);
}

PaymentService.prototype.cancelOrder = function(dbname, dbcol, orderno) {
	console.log('cancel order');
	var self = this;
	//var orderno = self.dbobj.orderno;
	MongoClient.connect(url, {useUnifiedTopology: true, 
	   useNewUrlParser: true}, function(err, client) {

		if (err) throw err;
		console.log("Successfully connected to server");
		const db = client.db(dbname);
		var dt = moment().unix();
	  db.collection("order").updateOne({"orderno" : orderno},
			{$set: { "states" : 'cancelled', "updated": dt}},function(err, res) {
		    if (err) throw err;		    
		    client.close();
		});
	});

}

PaymentService.prototype.ListOrder = function(dbname, dbcol, cb) {
	console.log('List Order');
	var self = this;
	MongoClient.connect(url, {useUnifiedTopology: true, 
   		useNewUrlParser: true}, function(err, client) {

		if (err) throw err;
	
		const db = client.db(dbname);
		
	  	var allProductsArray = db.collection(dbcol).find({}).toArray(function(err, results) {

			var output = '<html><header><title>Order List</title></header><body>';
		          output += '<h1>Order List</h1>';
		          output += '<table border="1"><tr><td><b>' + 'OrdeeeeerNo' + '</b></td><td><b>' + 'Amount' + '</b></td><td><b>'
		          		+ 'User' + '</b></td><td><b>' + 'Status' + '</b></td><td><b>'
		          		+ 'created' + '</b></td></tr>';

		  
		  	results.forEach(function(result){
		            output += '<tr><td>' + result.orderno + '</td><td>' + result.amount + '</td><td>' + result.username + '</td><td>'
		            + result.states + '</td><td>' + result.created + '</td></tr>';
		          });

		  	// write HTML output (ending)
		    output += '</table></body></html>'
		    client.close();
		    cb(null,output);
		    // send output back
		    
	  
		})
		
	})
}


PaymentService.prototype.deliveredOrder = function(obj) {
	var self = this;
	console.log('deliver order:');
	var orderno = self.orders.shift();
	console.log('orderno:'+orderno);
	MongoClient.connect(url, {useUnifiedTopology: true, 
	   useNewUrlParser: true}, function(err, client) {

		if (err) throw err;
		console.log("Successfully connected to server");
		const db = client.db(self.dbname);
		var dt = moment().unix();
		if(obj.state == 'confirmed'){
			console.log('delivered order');
			db.collection("order").updateOne({"orderno" : orderno},
				{$set: { "states" : 'delivered', "updated": dt}},function(err, res) {
			    if (err) throw err;		    
			    client.close();
			});	
		}
	  	
	});	
}

PaymentService.prototype.updateOrder = function(state) {
	var self = this;
	console.log('updateorder:'+state);
	var orderno = self.dbobj.orderno;
	console.log('orderno:'+orderno);
	MongoClient.connect(url, {useUnifiedTopology: true, 
	   useNewUrlParser: true}, function(err, client) {

		if (err) throw err;
		console.log("Successfully connected to server");
		const db = client.db(self.dbname);
		var dt = moment().unix();
	  	db.collection("order").updateOne({"orderno" : orderno},
			{$set: { "states" : state, "updated": dt}},function(err, res) {
		    if (err) throw err;		    
		    client.close();
		});
	});
	var obj = {"orderno":orderno, "state":state};
	self.nextStage(true, obj);
}

PaymentService.prototype.nextStage = function(r, obj) {
	var self = this;
	this.orders.push(obj.orderno);
	console.log('tmeout:'+obj)
	
	setTimeout(function() {
		self.emit('deliveredOrder', obj);
		console.log('timeout!! fire event');
	}, config.freq * 1000);
};

module.exports = new PaymentService;
