

export interface IStore{
    posStoreId:number;
    name:string;
    description:string;
    timezone:string;
    streetAddress?:string;
    city:string;
    postCode:number;
    country:string;
    state:string;
    longitude?:number;
    latitude?:number;
    phone?:string;
    email?:string;
    isActive?:boolean;
}


export class Store{

    PostStore(store:IStore[]){


    }

    GetStore(id:number){

    }

}