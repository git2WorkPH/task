import * as fs from 'fs'
import _ from 'lodash'
import * as mysql from 'mysql'
import { IStore } from '../model/store'
import { IStoreOperatingHours } from '../model/storeOperationHours'
import { IStorePickupTime } from '../model/storePickupTime'

let insertSQL = 'Insert into Store (posStoreId,name,description,timezone,streetAddress,suburb,postcode,state,longitude,latitude,country,phone,email,isActive) VALUE '
let operatingHourInsertSQL = 'Insert into StoreOperatingHours (storeId,dayOfWeek,openingTime,closingTime) VALUE '
let pickUpTimeInsertSQL =  'Insert into StoreOperatingHours (storeId,dayOfWeek,from,to) VALUE ' 

export function OpenConnection(){

  const connection =  mysql.createConnection({
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


export function SaveToDB(locations:IStore[],operatingHours?:IStoreOperatingHours[],pickUpTime?:IStorePickupTime[]){

  const connection = OpenConnection()
  const ids = locations.map(location => location.posStoreId)


  connection.query(`Select * From Store Where posStoreId IN (${ids})`,function(err,results){
      if(err) throw new Error(err.stack)
      
      //  TODO: implement this later
      // const resultIds = results.map((ele:any)=>ele.id)
      // const diff = _.difference(ids,resultIds)
      // let filteredLocations:IStore[]= [];
      // console.log('diff',diff)
      // if(diff.length > 0){
      //    filteredLocations = locations.filter(ele=>{
      //     //exclude the record that already exists in the DB
      //   })
      // }
      if(results.length === 0){
        //bulkInsert('Store',locations)
        // if(operatingHours) bulkInsert('StoreOperatingHours',operatingHours!)
        // if(pickUpTime) bulkInsert('StorePickupTime',pickUpTime!)

        locations.forEach(location=>{

         const value = `(
            ${location.posStoreId},
            '${location.name}',
            '${location.description }',
            '${location.timezone === null ? "''" : location.timezone}',
            '${location.streetAddress === null ? "''" : location.streetAddress}',
            '${location.suburb === null ? "''" : location.suburb}',
            ${location.postCode === null ? null : location.postCode},
            '${location.state === null ? "''" : location.state}',
            ${location.longitude === null ? null : Number.isInteger(location.longitude) ? 0 : location.longitude  },
            ${location.latitude=== null ? null : Number.isInteger(location.latitude)? 0 : location.latitude  },
            'Australia',
            '${location.phone=== null ? "''" : location.phone}',
            '${location.email === null ? "''" : location.email}',
            ${location.isActive});`
          connection.query(insertSQL + value, (err,results)=>{

             const insertValue =  location.regularHours?.map(ele=>{
               return `(${results.insertId},${ele.dayOfWeek},'${ele.openingTime}','${ele.closingTime}')`
             })
             
             fs.writeFileSync('./output/operating.sql',operatingHourInsertSQL+insertValue)
             connection.query(operatingHourInsertSQL+insertValue,(err)=>{
               if(err) throw new Error(err.stack)

               connection.commit((err)=>{
                 if(err){
                    connection.rollback()
                    throw new Error(err.stack)
                 }
               })
             })
          })
        })
      }else{
        console.log('No new record added.')
      }
   
    })
}


export function bulkInsert( table:string, objectArray:object[]) {
    const connection = OpenConnection()

    let keys = Object.keys(objectArray[0]);
    let values = objectArray.map(( obj:any) => keys.map( key => obj[key]));
    let sql = 'INSERT INTO ' + table + ' (' + keys.join(',') + ') VALUES ?';
  
    connection.query(sql, [values], function (error, results, fields) {
      if (error)  throw new Error(error.stack)

      connection.commit((err)=>{
        if(err) {
          connection.rollback()
          throw new Error(err.stack)
        }
        console.log('Added Successfully')
      })
      connection.end()
    });
}
