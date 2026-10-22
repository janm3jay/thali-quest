// Decides which reminders are due for one user. Pure, so it can be tested without a server.
const WINDOW=50; // a late scheduler run may still send up to this many minutes after the set time
function localParts(tz,now){
  let parts;
  try{parts=new Intl.DateTimeFormat('en-CA',{timeZone:tz||'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);}
  catch(e){parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);}
  const g=t=>parts.find(p=>p.type===t).value;
  return{date:g('year')+'-'+g('month')+'-'+g('day'),min:(+g('hour'))*60+(+g('minute'))};
}
const toMin=s=>{const a=String(s||'').split(':').map(Number);return(a[0]||0)*60+(a[1]||0);};
const pick=(arr,seed)=>arr[Math.abs(seed)%arr.length];
function hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return h;}
function sentKeys(doc,now){const p=localParts(doc.tz,now);return doc.sent&&doc.sent.date===p.date&&doc.sent.keys?doc.sent.keys:{};}
const MSG={
  b:['Breakfast time. Log it and start the day with a win.','Good morning. What is on your plate today?','Fuel up. A good breakfast sets up the day.'],
  l:['Lunch time. Add it to your day.','Time for lunch. Log your thali when you can.','Midday check: lunch logged yet?'],
  d:['Dinner time. Log it and close out the day.','Dinner is a good place to stay on budget. Log it.','Evening meal. Add it before you forget.'],
  wk:['Workout time. Your plan is ready.','Time to move. Today’s session is waiting.','Quick session today? Your plan is ready.'],
  cl:['Close the day: log what is left and finish your quests.','Last call for today’s quests. Keep your streak going.','Before bed: log anything missing and close the day.'],
  w:['Time for a glass of water.','Water break. Drink a glass now.','Stay hydrated. Have some water.']
};
function due(doc,now){
  if(!doc||!doc.on||!doc.sub)return[];
  const{date,min}=localParts(doc.tz,now),sent=sentKeys(doc,now),pr=doc.progress&&doc.progress.date===date?doc.progress:null;
  const t=doc.times||{},on=doc.tOn||{},out=[],inWin=tm=>tm&&min>=toMin(tm)&&min<toMin(tm)+WINDOW;
  const msg=(k,extra)=>pick(MSG[k],hash(date+k))+(extra||'');
  for(const k of['b','l','d']){
    if(on[k]&&inWin(t[k])&&!sent[k]&&!(pr&&pr.meals&&pr.meals[k]))out.push({key:k,title:{b:'Breakfast',l:'Lunch',d:'Dinner'}[k],body:msg(k,pr&&pr.target?' Budget: '+pr.target+' kcal.':''),url:'./?a=food'});
  }
  if(on.wk&&inWin(t.wk)&&!sent.wk&&pr&&pr.work==='pending')out.push({key:'wk',title:'Workout',body:msg('wk'),url:'./?a=train'});
  if(on.cl&&inWin(t.cl)&&!sent.cl&&!(pr&&pr.closed))out.push({key:'cl',title:'Close the day',body:msg('cl',pr&&pr.kcalLeft>0?' About '+pr.kcalLeft+' kcal left.':''),url:'./'});
  const w=doc.water;
  if(w&&w.on&&!(pr&&pr.water>=8)){
    const from=toMin(w.from||'09:00'),to=toMin(w.to||'21:00'),step=Math.max(1,w.every||2)*60;
    for(let tm=from,i=0;tm<=to;tm+=step,i++){
      const key='w'+i;
      if(min>=tm&&min<tm+WINDOW&&!sent[key]){out.push({key,title:'Water',body:msg('w',pr?' '+pr.water+' of 8 so far.':''),url:'./?a=water'});break;}
    }
  }
  return out.slice(0,2);
}
module.exports={due,localParts,sentKeys,WINDOW};
