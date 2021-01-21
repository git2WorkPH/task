import * as _ from 'lodash'
import * as fs from 'fs'
import * as axios from 'axios'
import { IStore } from './model/store'
import { connection, SaveToDB } from './serivces/sql.service'
import { IStoreOperatingHours } from './model/storeOperationHours'
import { IStorePickupTime } from './model/storePickupTime'
import {Sequelize} from 'sequelize'
import Connection from 'mysql2/typings/mysql/lib/Connection'
 

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


export let sequelize:Sequelize;
 sequelize = new Sequelize({
    host:'127.0.0.1',
    username:'root',
    password:'123b!lue456',
    database:'Bhyve',
    dialect:'mysql',
})
  let endPoint =  process.env.endPoint!
 
  if(!fs.existsSync('./output')){
    fs.mkdirSync('./output')
    }

  const sendGetRequest = async () => {
    try {

        // await sequelize.authenticate();
        // console.log('Connection has been established successfully.');

        const resp = await axios.default.get('http://gygapi.xchangefusion.com/api/v1/terminals/AllLocations?api_key=gygcw2017!');
        const items:any[]=  resp.data.Items
        const storeObject: IStore[] = items.map(item=>{

            let operatingHours: IStoreOperatingHours[]=[];
            let pickUpTimes: IStorePickupTime[]= [];
            if(item.RegularHours.length > 1 ){
                operatingHours = item.RegularHours?.map((operatingHour:any) =>{
                    return {
                            dayOfWeek:operatingHour.DayOfWeek ,
                            openingTime:operatingHour.OpeningTime,
                            closingTime:operatingHour.ClosingTime
                            }
                    
                })
            }

            return {
                posStoreId: item.LocationNo,
                name:item.LocationFriendlyName,
                description:item.LocationDescription,
                timezone:!item.TimeZoneId ? null: item.TimeZoneId,
                streetAddress:!item.StreetAddress ? null : item.StreetAddress,
                suburb:!item.Suburb ? null : item.Suburb,
                country:'Australia',
                postCode:!item.PostCode ? null : item.PostCode,
                state:!item.State ? "''" : item.State,
                longitude:!item.Longitude ? null : Number.isInteger(item.Longitude)? 0 : item.Longitude , 
                latitude:!item.Latitude ? null : Number.isInteger(item.Latitude)? 0 : item.Latitude,
                phone:!item.LocationPhone ? "''" : item.LocationPhone,
                email:!item.LocationEmail ? "''" : item.LocationEmail,
                isActive:item.IsActive,
                regularHours:operatingHours,
            }
        })

        fs.writeFileSync('./output/location.json',JSON.stringify(storeObject,null,3))
       SaveToDB(storeObject)
       
    } catch (err) {
        console.error(err);
    }
};

sendGetRequest() 
