import * as _ from 'lodash'
import * as fs from 'fs'
import * as axios from 'axios'
import { IStore } from './model/store'
import { OpenConnection, SaveToDB } from './serivces/sql.service'
import { IStoreOperatingHours } from './model/storeOperationHours'
import { IStorePickupTime } from './model/storePickupTime'
import {Sequelize} from 'sequelize'
 

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

        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const resp = await axios.default.get('http://gygapi.xchangefusion.com/api/v1/terminals/AllLocations?api_key=gygcw2017!');
        const items:any[]=  resp.data.Items
        const storeObject: IStore[] = items.map(ele=>{

            let operatingHours: IStoreOperatingHours[]=[];

            if(ele.RegularHours.length>0){
                operatingHours = ele.RegularHours?.map((operatingHour:any) =>{
                        return {
                                tempId:operatingHour.LocationId,
                                dayOfWeek:operatingHour.DayOfWeek,
                                openingTime:operatingHour.OpeningTime,
                                closingTime:operatingHour.ClosingTime
                                }
                })
            }

            return {
                posStoreId: ele.LocationNo,
                name:ele.LocationFriendlyName,
                description:ele.LocationDescription,
                timezone:!ele.TimeZoneId ? null: ele.TimeZoneId,
                streetAddress:!ele.StreetAddress ? null : ele.StreetAddress,
                suburb:!ele.Suburb ? null : ele.Suburb,
                country:'Australia',
                postCode:!ele.PostCode ? null : ele.PostCode,
                state:!ele.State ? "''" : ele.State,
                longitude:!ele.Longitude ? null : Number.isInteger(ele.Longitude)? 0 : ele.Longitude , 
                latitude:!ele.Latitude ? null : Number.isInteger(ele.Latitude)? 0 : ele.Latitude,
                phone:!ele.LocationPhone ? "''" : ele.LocationPhone,
                email:!ele.LocationEmail ? "''" : ele.LocationEmail,
                isActive:ele.IsActive,
                regularHours:operatingHours
            }
        })

        fs.writeFileSync('./output/location.json',JSON.stringify(storeObject))
        const regularHours = _.flatten( items.map(ele=>ele.RegularHours).filter(x=>x.length>0))
        let operatingHoursObject: IStoreOperatingHours[] = [];
        if(regularHours?.length > 0){

            operatingHoursObject = regularHours?.map(ele=>{
              
                    return {
                        dayOfWeek:ele.DayOfWeek,
                        openingTime:ele.OpeningTime,
                        closingTime:ele.ClosingTime
                    }
            })
        }
        
        const pickUpTimes = _.flatten(items.map(ele=>ele?.PickUpTimes)?.filter(x=>x?.length>0))
        let pickUpTimeObject: IStorePickupTime[]= [];
        if(pickUpTimes?.length > 0){
           pickUpTimeObject= pickUpTimes?.map(ele=>{
                    return {
                        tempId:ele.LocationId,
                        dayOfWeek:ele.DayOfWeek,
                        from:ele.From,
                        to:ele.To
                    }
            })
        }
     
       SaveToDB(storeObject,operatingHoursObject,pickUpTimeObject)

    } catch (err) {
        console.error(err);
    }
};

sendGetRequest() 
