import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { User } from '../../models/user';
import * as firebase from 'firebase';
import { exceptionGuard } from '@firebase/database/dist/src/core/util/util';

@IonicPage()
@Component({
  selector: 'page-add-friend',
  templateUrl: 'add-friend.html',
})
export class AddFriendPage {
  user = {} as User;
  tId = "" as string;
  scanned = false as boolean;
  email = "" as string;
  msg = "" as string;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public toastCtrl: ToastController) {
    this.user = navParams.data;
  }

  ionViewDidLoad() {
    
  }


  submitEmail(){
    var ucRef = firebase.firestore().collection('Users').where("email", "==", this.email).get().then((d)=>{
      if (d.docs.length > 0){
        console.log("has !");
        this.pushFriendRequest(d.docs[0].id);
      }
      else{
        // cannot find this guy
        let err = this.toastCtrl.create({
          message: "Cannot find user with email: " + this.email,
          duration: 3000,
          position: "bottom"
        });
        err.present();
      }
    });
  }

  scanQR(){
    var cbFunction = (params) => {
      return new Promise((resolve,reject)=>{
        this.tId = params;
        if (undefined != this.tId && "" != this.tId){
          firebase.firestore().collection('Users').doc(this.tId).get().then(doc=>{
            if (doc.exists){
              this.email = doc.data().email;
              this.scanned = true;
            }
          })
        }
        resolve();
      });
    }
    this.navCtrl.push('QrScanPage', {callback: cbFunction});
  }

  async pushFriendRequest(fId){
    try{
      // find the friend list if it has the user
      let fRef = firebase.firestore().collection('Users').doc(fId);
      let uRef = firebase.firestore().collection('Users').doc(this.user.uid);

      // if it is same person, function return
      if (fId == this.user.uid){
        let err = this.toastCtrl.create({
          message: "You cannot add yourself",
          duration: 3000,
          position: "bottom"
        });
        err.present();
        return undefined; // skip out
      }

      // determine if the person is already in list
      if (this.user.friendList.length > 0 && undefined != this.user.friendList.find((ele)=>{return ele.isEqual(fRef);})){
        let err = this.toastCtrl.create({
          message: "You've already add your friend",
          duration: 3000,
          position: "bottom"
        });
        err.present();
        return undefined; // skip out
      }

      // determine if the person is in the block list
      var isBlocked = false;
      var ref = await fRef.get();
      var is = await ref.data().blockedUsers.find((bu)=>{ return bu.isEqual(uRef); });
      if (undefined != is){
          let err = this.toastCtrl.create({
            message: "Cannot find user with email: " + this.email,  // Even its blocked, show cannot find to prevent user
            duration: 3000,
            position: "bottom"
          });
          err.present();
          isBlocked = true;
        }
      if (!isBlocked) {
        // get friends' request
        let fReq = firebase.firestore().collection('Request').doc(fId);
        let fReqGet = await fReq.get();
        is = fReqGet.data().friendRequest.find((fr)=> { return fr.from.isEqual(uRef); });
        if (undefined == is){
          let fReqList = fReqGet.data().friendRequest;
          fReqList.push({
            from: uRef,
            msg: this.msg.trim()
          });
          fReq.update('friendRequest',fReqList);
        }
        let msg = this.toastCtrl.create({
          message: "Sent " + this.email + " a friend request",  // Even its blocked, show cannot find to prevent user
          duration: 3000,
          position: "bottom"
        });
        msg.present();
        this.navCtrl.pop();
    }}
    catch(e){
      console.log(e);
    }
  }
}
