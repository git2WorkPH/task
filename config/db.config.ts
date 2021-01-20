module.exports = {
    host: "localhost",    
    user: process.env.sql_user,
    password: process.env.sql_pwd,
    db: process.env.sql_dbname,
    dialect: "mysql",
    pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
    }    
};