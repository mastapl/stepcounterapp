const mysql = require("mysql2");
require('dotenv').config();

const conn = mysql.createPool({
    connectionLimit : 10,
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    port: process.env.MYSQLPORT,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE
});

// conn.connect((err)=>{
//     if(err) throw err;
//     console.log("Polaczono z baza danych");
// });

module.exports = conn;