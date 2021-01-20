
import * as mysql from 'mysql'

export function OpenConnection(){

const connection = mysql.createConnection({
    host            : '127.0.0.1',
    user            : process.env.sql_user,
    password        : process.env.sql_pwd,
    database        : process.env.sql_dbname
})

connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
});

return connection;

}

// function bulkInsert(connection, table:string, objectArray:object[], callback:()=>{}) {
//     let keys = Object.keys(objectArray[0]);
//     let values = objectArray.map( obj => keys.map( key => obj[key]));
//     let sql = 'INSERT INTO ' + table + ' (' + keys.join(',') + ') VALUES ?';
//     connection.query(sql, [values], function (error, results, fields) {
//       if (error) callback(error);
//       callback(null, results);
//     });
//   }
  
//   bulkInsert(connection, 'my_table_of_objects', objectArray, (error, response) => {
//     if (error) res.send(error);
//     res.json(response);
//   });
