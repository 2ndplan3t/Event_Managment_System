const mysql = require('mysql2');

const db = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    port: 3306,
    user: "VolunteerHook",
    password: "VHook101",
    database: "volunteerdb",
});

db.getConnection((err, connection) =>{
    if(err){
        console.error("Error connection to database:", err);
    }

    else{
        console.log("Database connection success!");
        connection.release();
    }

});

module.exports = db;