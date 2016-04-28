# node-red-contrib-db2

A <a href="http://nodered.org" target="_new">Node-RED</a> node to read and write to a DB2 database.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-contrib-db2

Usage
-----

Allows basic access to a DB2 database.

The `msg.database` must hold the <i>database</i>

The `msg.topic` must hold the <i>query</i>

and the result is returned in `msg.payload`.

Each row will send a new payload, so you can work with big results.

Typically the returned payload will be an array of the result rows.

If nothing is found for the key then <i>null</i> is returned.


