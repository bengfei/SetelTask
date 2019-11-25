var PaymentService = require('../service/paymentService');
var moment = require('moment');
var request = require('request');
var config = require('../config/config');

const mongodbserver = config.mongoserver;
const dbname = config.mongodbname;

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://' + mongodbserver;

var users = [
			{"id":001,"username":"setel001","token":"token001"}, 
			{"id":002,"username":"setel002","token":"token002"}, 
			{"id":003,"username":"setel003","token":"token003"},
			{"id":004,"username":"setel004","token":"token004"},
			{"id":005,"username":"setel005","token":"token005"}
		];


function OrderService(){
	
}

exports.startOrder = function(req, res, next) {
	var self = this;
	var dt = moment().unix();
	var username = users[Math.floor(Math.random()*users.length)].username;
	var orderno = username + dt;
	var genAmount = Math.floor(Math.random()*100);
	var myobj = { orderno: orderno, amount: genAmount, states: "created", username: username, created: dt, updated: dt };
	
	PaymentService.init(dbname,'order',myobj);
	res.send('Order created:'+orderno);
};

exports.cancelOrder = function(req, res, next) {
	var self = this;
	PaymentService.cancelOrder(dbname,'order',req.query.orderno,function(err, output) {
		res.send(output);
	});
};

exports.ListOrder = function(req, res, next) {
	var self = this;	
	PaymentService.ListOrder(dbname,'order', function(err, output) {
		res.send(output);
	});
	
};