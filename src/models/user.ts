export interface User{
    uid?: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    birth: Date;
    gender: string;
    avatar?: string;
    eventList: Array<any>;
    friendList: Array<any>;
    blockedUsers: Array<any>;
    location: any;
}