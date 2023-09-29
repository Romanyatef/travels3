const mysql = require('mysql');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.HOST_DB,
  user:process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE_NAME, 
  port: process.env.PORT_DB,
});

connection.connect((err)=> { 
  if (err) {
    console.error('connection error');
    console.log(err) 
    return; 
  }

  console.log('connected');
});


module.exports=connection; 