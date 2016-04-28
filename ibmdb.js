module.exports = function(RED) {
    "use strict";
    var reconnect = RED.settings.ibmdbReconnectTime || 30000;
    var db2 = require('ibm_db');
    var Promise = require('promise');

    function IbmDBNode(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
        this.connected = false;
        this.connecting = false;
        this.dbname = n.db;
        var node = this;

        function doConnect(conncb) {
            node.connecting = true;
            node.conn = {};
            node.connection = {
                connect: (cb) => {
                    var conStr = "DRIVER={DB2};DATABASE="+node.dbname
                                +";HOSTNAME="+node.host
                                +";UID="+node.credentials.user
                                +";PWD="+node.credentials.password
                                +";PORT="+node.port+";PROTOCOL=TCPIP"; 
                    db2.open(conStr, function (err,conn) {
                        if (err) {
                            cb(err, null);  
                        } 
                        else {
                            console.log('connection to ' + node.dbname);
                            conn.connName = node.dbname;        
                            cb(null, conn);
                        }
                    });
                },
                end: (conn) => {
                    conn.close(() => {
                        console.log('connection closed');
                    });
                }
            };
            node.connection.connect(function(err, conn) {
                node.connecting = false;
                if (err) {
                    node.error(err);
                    console.log("connection error " + err);
                } else {
                    node.conn = conn;
                    node.connected = true;
                }
                conncb(err);
            });
        }

        this.connect = function() {
            return new Promise((resolve, reject) => {
                if (!this.connected && !this.connecting) {
                    doConnect((err)=>{
                        if(err) reject(err);
                        else resolve();
                    });
                }  
                else{
                    resolve();
                }  
            });
        }

        this.on('close', function (done) {
            if (this.connection) {
                node.connection.end(this.conn);
            } 
            done();
        });
    }
    
    RED.nodes.registerType("IbmDBdatabase", IbmDBNode, {
        credentials: {
            user: {type: "text"},
            password: {type: "password"}
        }
    });
    
    function IbmDBNodeIn(n) {
   
        RED.nodes.createNode(this,n);
        this.mydb = n.mydb;
        var node = this;

        node.query = function(node, msg){
            if ( msg.topic !== null && typeof msg.topic === 'string' && msg.topic !== '') {
                node.mydbNode.conn.query(msg.topic, function(err, rows) {
                    if (err) { 
                        console.log("QUERY ERROR "+ err);
                        node.error(err,msg); 
                    }
                    else {
                        rows.forEach(function(row) {
                            node.send({ payload: row });
                        })
                    }
                });
            }
            else {
                if (msg.topic === null) { 
                    node.error("msg.topic : the query is not defined");
                }
                if (typeof msg.topic !== 'string') { 
                    node.error("msg.topic : the query is not defined as a string");
                }
                if (typeof msg.topic === 'string' && msg.topic === '') { 
                    node.error("msg.topic : the query string is empty");
                }
            }
        }

        node.on("input", (msg) => {
            if ( msg.database !== null && typeof msg.database === 'string' && msg.database !== '') {
                node.mydbNode = RED.nodes.getNode(n.mydb);
                if (node.mydbNode) {
                    if(node.mydbNode.conn && node.mydbNode.conn.connName === msg.database){
                        console.log("already connected");
                        node.query(node, msg);
                    }
                    else{
                        node.mydbNode.connect()
                        .then(()=>{
                            node.query(node, msg);
                        });
                    }
                }
                else {
                    this.error("database not configured");
                }
            }
            else{
                this.error("database not specified");
            }
        });
    }
    
    RED.nodes.registerType("ibmdb", IbmDBNodeIn);
}
