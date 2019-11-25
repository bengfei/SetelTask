# SetelTask

First, startup both node-orderSystem and node-paymentSystem via command "node index.js"

1. prepare a mongodb
2. update config.js if you specified any other port and ip address
3. npm install for node modules
4. node index.js to startup both order and payment system

To demo order system, assuming running on localhost, one can

http://localhost:4000/orderList - to display order list
http://localhost:4000/orderCancel?orderno=setel0041574618242 - to cancel a particular order
http://localhost:4000/order - to create order

