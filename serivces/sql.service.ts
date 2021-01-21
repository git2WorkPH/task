import * as fs from 'fs'
import _ from 'lodash'
import * as mysql from 'mysql'
import { Sequelize } from 'sequelize/types'
import { sequelize } from '..'
import { IStore } from '../model/store'
import { IStoreOperatingHours } from '../model/storeOperationHours'
import { IStorePickupTime } from '../model/storePickupTime'
import * as moment from 'moment'

let insertSQL = 'Insert into Store (posStoreId,name,description,timezone,streetAddress,suburb,postcode,state,longitude,latitude,country,phone,email,isActive,createdOn,createdBy) VALUE '
let operatingHourInsertSQL = 'Insert into StoreOperatingHours (storeId,dayOfWeek,openingTime,closingTime,createdOn,createdBy) VALUE '
let pickUpTimeInsertSQL =  'Insert into StorePickUpTime (storeId,dayOfWeek,from,to) VALUE ' 

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

export let connection:mysql.Connection;
export function SaveToDB(stores:IStore[],pickUpTime?:IStorePickupTime[]){

  const connection = OpenConnection()
  const posStoreIds = stores.map(location => location.posStoreId)

  const newDate = new Date();
  const createdOn = newDate.getUTCFullYear() +"/"+ (newDate.getUTCMonth()+1) +"/"+ newDate.getUTCDate() + " " + newDate.getUTCHours() +
                   ":" + newDate.getUTCMinutes() + ":" + newDate.getUTCSeconds();

  connection.beginTransaction((err)=>{

    if(err) {
      throw new Error(err.stack)
    }

    connection.query(`Select * From Store Where posStoreId IN (${posStoreIds})`,function(err,results){
      if(err) throw err
      
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

        stores.forEach(location=>{

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
            ${location.isActive},
            '${createdOn}',
            ${1});`

          connection.query(insertSQL + value, (err,results)=>{
            if(err) {
              fs.writeFileSync('./output/store_error.log',insertSQL + value)
              throw  err
            }

             const insertValue =  location.regularHours?.map(ele=>{
               return `(${results.insertId},${ele.dayOfWeek},'${ele.openingTime}','${ele.closingTime}','${createdOn}',${1})`
             })
           
             if(insertValue?.length){
                connection.query(operatingHourInsertSQL+insertValue,(err)=>{
                  if(err) {
                    fs.writeFileSync('./output/operating_error.log',operatingHourInsertSQL+insertValue)
                    throw new Error(err.stack)
                    }
                    
                })
             }

            
          })
        })
      }else{
        console.log('No new record added.')
      }
    })

    connection.commit((err)=>{
      if(err){
        fs.writeFileSync('./output/error.log',JSON.stringify(err.stack))
        connection.rollback()
        throw err
      }
      console.log('Sync Successfully')
    })

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
