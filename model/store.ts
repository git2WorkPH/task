import { IStoreOperatingHours } from "./storeOperationHours";
import { IStorePickupTime } from "./storePickupTime";


export interface IStore{
    id?:number;
    posStoreId:number;
    name:string;
    description:string;
    timezone:string;
    streetAddress:string;
    suburb:string;
    postCode:number;
    country:string;
    state:string;
    longitude:number;
    latitude:number;
    phone:string;
    email:string;
    isActive:boolean;
    regularHours?:IStoreOperatingHours[],
    pickUpTimes?:IStorePickupTime[]
}


export class Store{

    PostStore(store:IStore[]){


    }

    GetStore(id:number){

    }

}