// Runs on a schedule in GitHub Actions. Sends due reminders as web push messages.
const admin=require('firebase-admin'),webpush=require('web-push'),core=require('./reminders-core');
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))});
webpush.setVapidDetails('https://janm3jay.github.io/thali-quest/',process.env.VAPID_PUBLIC,process.env.VAPID_PRIVATE);
(async()=>{
  const db=admin.firestore(),snap=await db.collection('private').where('on','==',true).get(),now=new Date();
  let users=0,sent=0,failed=0;
  for(const d of snap.docs){
    const doc=d.data(),items=core.due(doc,now);if(!items.length)continue;
    users++;const keys=Object.assign({},core.sentKeys(doc,now));let gone=false;
    for(const it of items){
      try{await webpush.sendNotification(doc.sub,JSON.stringify({title:it.title,body:it.body,url:it.url,tag:it.key}),{TTL:3600,urgency:'normal'});keys[it.key]=1;sent++;}
      catch(e){if(e.statusCode===404||e.statusCode===410){gone=true;break;}failed++;}
    }
    if(gone)await d.ref.set({on:false,sub:admin.firestore.FieldValue.delete()},{merge:true});
    else await d.ref.set({sent:{date:core.localParts(doc.tz,now).date,keys}},{merge:true});
  }
  // counts only: this log is public, so it never prints names, tokens or times
  console.log('users',users,'sent',sent,'failed',failed);
})().catch(e=>{console.error('run failed',e&&e.code||'error');process.exit(1);});
