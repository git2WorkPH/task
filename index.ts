import * as mysql from 'mysql'
import * as fs from 'fs'
import * as axios from 'axios'
import { IStore } from './model/store'
import { OpenConnection } from './serivces/sql.service'

/**
 * TODO:
 * 1. establish mysql connection - Done
 * 2. get locations from TASK API - Done
 * 3. map locations based on the store fields - Done
 * 4. perform a data validation 
 * 5. check if the data are:
 *      * if data doesn't exist then save immediately
 *      * if data exists check if for any fields update. e.g description has changed, email has changes and so on. 
 * 6. save the data to mysql database - Done
 */

  
  const connection = OpenConnection()
    
  let endPoint = 'http://gygapi.xchangefusion.com/api/v1/terminals/AllLocations?api_key=gygcw2017!'
//   
  let insertSQL = 'Insert into Store (posStoreId,name,description,timezone,streetAddress,city,postcode,state,longitude,latitude,country,phone,email,isActive) VALUE '
  let operatingHourSQL = 'Insert into StoreOperatingHours (storeId,dayOfWeek,openingTime,closingTime) VALUE '
  let pickUpTimeSQL =  'Insert into StoreOperatingHours (storeId,dayOfWeek,from,to) VALUE ' 

  if(!fs.existsSync('./output')){
    fs.mkdirSync('./output')
}

  const sendGetRequest = async () => {
    try {

        const resp = await axios.default.get(endPoint);
        const locations: any[] =  resp.data.Items

        locations.map(location =>{

            connection.beginTransaction(function(err){
                if(err) throw new Error(err.stack)
    
                // TODO: check if the locationNo existing or not
                connection.query(`Select * FROM Store Where posStoreId =  ${location.LocationNo}`, (err, results)=>{
                    if(err) throw new Error(err.stack)
                        
                    if(!results?.length){

                        console.log('unique',results)
                        const value = `(
                            ${location.LocationNo},
                            '${location.LocationFriendlyName}',
                            '${location.LocationDescription }',
                            '${location.TimeZoneId === null ? "''" : location.TimeZoneId}',
                            '${location.StreetAddress === null ? "''" : location.StreetAddress}',
                            '${location.City === null ? "''" : location.City}',
                            ${location.PostCode === null ? null : location.PostCode},
                            '${location.State === null ? "''" : location.State}',
                            ${location.Longitude === null ? null : Number.isInteger(location.Longitude)? 0 : location.Longitude  },
                            ${location.Latitude=== null ? null : Number.isInteger(location.Longitude)? 0 : location.Latitude  },
                            'Australia',
                            '${location.LocationPhone=== null ? "''" : location.LocationPhone}',
                            '${location.LocationEmail === null ? "''" : location.LocationEmail}',
                            ${location.IsActive});`    
                        
                            connection.query(insertSQL+value,(err,results)=>{
                                if(err) {
                                    throw new Error(err.stack)
                                }
                                console.log('insert',results.insertId) //get the insertId and assign it to the storeId to storeOperatingHours and storePickupTime
                             
                                // if(location.RegularHours){
                                //     console.log(location.RegularHours)
                                //     location.RegularHours.map((regularHour:any)=>{
                                //         console.log('regularHours',regularHour)
                                //         const value = `(
                                //             ${results.insertId},
                                //             ${regularHour.DayOfWeek},
                                //             '${regularHour.OpeningTime}',
                                //             '${regularHour.ClosingTime}'
                                //         );`
                                        
                                //         connection.query(operatingHourSQL+value,(err,results)=>{
                                //             if(err){ 
                                //                 console.log('operatingHours',operatingHourSQL+value)
                                //                 fs.writeFileSync('./output/storeOperatingHours.sql',operatingHourSQL+value)
                                //                 connection.rollback()
                                //                 throw new Error(err.stack)
                                //             }
                                //             console.log('insert operating hours',results)
                                //         })    

                                //     })
                                // }

                                connection.commit(function(err){
                                    if(err){
                                        connection.rollback(()=>{
                                            throw new Error(err.stack)
                                        })
                                    }
                                    console.log('added successfully')
                                  
                                })
                            })
                            
                            
                    }else{
                        console.log('exist',results)
                    }
                })  
            })  
        })

    } catch (err) {
        console.error(err);
    }
};

sendGetRequest() 


type StoreOperatingHours = {
    dayOfWeek:number;
    openingTime:string;
    closingTime:string;
}

type StorePickupTime = {
    dayOfWeek:number;
    From:string;
    To:string;
}