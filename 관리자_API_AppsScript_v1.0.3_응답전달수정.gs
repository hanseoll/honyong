/** 한설 방송용 페이지 v1.0.3 관리자 API */
const SHEETS={fans:'팬정보',debts:'현재업보',honyo:'호뇽단',games:'게임',notices:'공지',schedule:'스케줄표',log:'관리기록'};
function setAdminSecret(){PropertiesService.getScriptProperties().setProperty('ADMIN_SECRET','dlgkstjf!')}
function doGet(){return HtmlService.createHtmlOutput('Honyong admin API v1.0.3')}
function doPost(e){const p=(e&&e.parameter)||{},id=p.requestId||'';try{verify_(p.secret);let d;switch(p.action){case'ping':d={ok:true};break;case'dashboard':d=dashboard_();break;case'updateDebt':d=updateDebt_(p,true);break;case'batchUpdateDebts':d=batchUpdateDebts_(p);break;case'undoLastDebt':d=undoLastDebt_();break;case'undoLastBatch':d=undoLastBatch_();break;case'saveFan':d=saveFan_(p);break;case'saveHonyo':d=saveHonyo_(p);break;case'addNotice':d=addNotice_(p);break;case'addSchedule':d=addSchedule_(p);break;case'saveGame':d=saveGame_(p);break;case'broadcastDashboard':d=broadcastDashboard_();break;case'startBroadcast':d=startBroadcast_(p);break;case'endBroadcast':d=endBroadcast_(p);break;case'addClip':d=addClip_(p);break;case'restoreBackup':d=restoreBackup_(p);break;default:throw new Error('알 수 없는 작업입니다.')}return response_(id,true,d,'')}catch(err){return response_(id,false,null,err.message||String(err))}}
function verify_(x){const s=PropertiesService.getScriptProperties().getProperty('ADMIN_SECRET');if(!s||s.indexOf('여기를_')===0)throw new Error('관리자 비밀번호를 먼저 설정하세요.');if(String(x||'')!==s)throw new Error('비밀번호가 올바르지 않습니다.')}
function response_(id,ok,data,error){
  const payload=JSON.stringify({
    source:'honyong-admin',
    requestId:id,
    ok:ok,
    data:data,
    error:error
  }).replace(/</g,'\u003c');

  const html='<!doctype html><meta charset="utf-8"><script>'+
    '(function(){'+
      'var message='+payload+';'+
      'try{window.parent.postMessage(message,"*");}catch(e){}'+
      'try{window.top.postMessage(message,"*");}catch(e){}'+
    '})();'+
    '</script>';

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function ss_(){return SpreadsheetApp.getActiveSpreadsheet()}function sh_(n){let s=ss_().getSheetByName(n);if(!s&&n===SHEETS.log){s=ss_().insertSheet(n);s.appendRow(['timestamp','actionId','nickname','debtType','beforeCount','afterCount','undone'])}if(!s)throw new Error('"'+n+'" 시트가 없습니다.');return s}
function heads_(s){const v=s.getRange(1,1,1,Math.max(1,s.getLastColumn())).getDisplayValues()[0],m={};v.forEach((x,i)=>m[String(x).trim().toLowerCase()]=i+1);return m}function col_(h,n,req=true){for(const x of n){const k=String(x).toLowerCase();if(h[k])return h[k]}if(req)throw new Error('필수 열 없음: '+n.join('/'));return 0}function text_(v){return String(v==null?'':v).trim()}function int_(v,z=false){const n=Math.floor(Number(v));if(!Number.isFinite(n)||n<(z?0:1))throw new Error('수량을 확인하세요.');return n}
function dashboard_(){const fans=listFans_(),debts=listDebts_(),honyo=countRows_(SHEETS.honyo),notices=countRows_(SHEETS.notices);return{fans,debts,recent:listRecent_(),batches:listBatches_(),stats:{fans:fans.length,debts:debts.reduce((a,b)=>a+b.count,0),honyo,notices}}}
function countRows_(name){const s=sh_(name);return Math.max(0,s.getLastRow()-1)}
function listFans_(){const s=sh_(SHEETS.fans);if(s.getLastRow()<2)return[];const h=heads_(s),n=col_(h,['nickname','닉네임']),i=col_(h,['id','아이디'],false),a=col_(h,['avatar','프로필사진'],false),c=col_(h,['color','대표색','프로필색'],false);return s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues().map(r=>({nickname:text_(r[n-1]),id:i?text_(r[i-1]):'',avatar:a?text_(r[a-1]):'',color:c?text_(r[c-1]):''})).filter(x=>x.nickname).sort((a,b)=>a.nickname.localeCompare(b.nickname,'ko'))}
function listDebts_(){const s=sh_(SHEETS.debts);if(s.getLastRow()<2)return[];const h=heads_(s),n=col_(h,['nickname','닉네임']),t=col_(h,['업보종류','type','종류']),c=col_(h,['개수','count']);return s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues().map(r=>({nickname:text_(r[n-1]),type:text_(r[t-1]),count:Number(r[c-1])||0})).filter(x=>x.nickname&&x.type&&x.count>0).sort((a,b)=>a.nickname.localeCompare(b.nickname,'ko')||a.type.localeCompare(b.type,'ko'))}
function saveFan_(p){const nickname=text_(p.nickname);if(!nickname)throw new Error('닉네임을 입력하세요.');const s=sh_(SHEETS.fans),h=heads_(s),n=col_(h,['nickname','닉네임']),i=col_(h,['id','아이디'],false),a=col_(h,['avatar','프로필사진'],false),c=col_(h,['color','대표색','프로필색'],false);let row=0;if(s.getLastRow()>=2){const v=s.getRange(2,n,s.getLastRow()-1,1).getDisplayValues();for(let x=0;x<v.length;x++)if(text_(v[x][0])===nickname){row=x+2;break}}if(!row)row=Math.max(2,s.getLastRow()+1);s.getRange(row,n).setValue(nickname);if(i)s.getRange(row,i).setValue(text_(p.fanId));if(a){const avatarMode=text_(p.avatarMode);s.getRange(row,a).setValue(avatarMode==='clear'?'':text_(p.avatar))}if(c)s.getRange(row,c).setValue(text_(p.color));return{nickname}}
function ensureFan_(n,id){
  const s=sh_(SHEETS.fans),h=heads_(s),nicknameCol=col_(h,['nickname','닉네임']),idCol=col_(h,['id','아이디'],false);
  if(s.getLastRow()>=2){
    const values=s.getRange(2,nicknameCol,s.getLastRow()-1,1).getDisplayValues();
    for(let x=0;x<values.length;x++){
      if(text_(values[x][0])===n){
        if(id&&idCol)s.getRange(x+2,idCol).setValue(id);
        return{x:x+2,nickname:n};
      }
    }
  }
  return saveFan_({nickname:n,fanId:id||'',avatar:'',color:'',avatarMode:'keep'});
}
function updateDebt_(p,log){const nickname=text_(p.nickname),type=text_(p.debtType),mode=text_(p.mode)||'add',amount=int_(p.amount,mode==='set');if(!nickname||!type)throw new Error('닉네임과 업보를 확인하세요.');const s=sh_(SHEETS.debts),h=heads_(s),nc=col_(h,['nickname','닉네임']),tc=col_(h,['업보종류','type','종류']),cc=col_(h,['개수','count']),uc=col_(h,['updatedat','업데이트'],false),mc=col_(h,['메모','memo'],false);let matches=[],before=0;if(s.getLastRow()>=2){s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues().forEach((r,x)=>{if(text_(r[nc-1])===nickname&&text_(r[tc-1])===type){matches.push(x+2);before+=Number(r[cc-1])||0}})}let after=mode==='subtract'?before-amount:mode==='set'?amount:before+amount;if(after<=0){matches.sort((a,b)=>b-a).forEach(r=>s.deleteRow(r));after=0}else{const row=matches[0]||Math.max(2,s.getLastRow()+1);s.getRange(row,nc).setValue(nickname);s.getRange(row,tc).setValue(type);s.getRange(row,cc).setValue(after);if(uc)s.getRange(row,uc).setValue(new Date());if(mc&&!matches.length)s.getRange(row,mc).setValue('관리자 페이지');matches.slice(1).sort((a,b)=>b-a).forEach(r=>s.deleteRow(r))}ensureFan_(nickname,'');if(log)logDebt_(nickname,type,before,after);return{nickname,debtType:type,newCount:after,beforeCount:before}}
function logDebt_(n,t,b,a,customId){const s=sh_(SHEETS.log),id=customId||Utilities.getUuid();s.appendRow([new Date(),id,n,t,b,a,false]);return id}

function batchUpdateDebts_(p){
  let items;
  try{items=JSON.parse(text_(p.itemsJson)||'[]')}catch(e){throw new Error('룰렛 결과 형식이 올바르지 않습니다.')}
  if(!Array.isArray(items)||!items.length)throw new Error('등록할 룰렛 결과가 없습니다.');
  if(items.length>200)throw new Error('한 번에 200종류까지만 등록할 수 있습니다.');

  const merged={};
  items.forEach(function(item){
    const nickname=text_(item.nickname),type=text_(item.type),count=int_(item.count);
    if(!nickname||!type)throw new Error('닉네임과 업보 종류를 확인하세요.');
    const key=nickname+'|||'+type;
    if(!merged[key])merged[key]={nickname:nickname,type:type,count:0};
    merged[key].count+=count;
  });

  const batchId='batch-'+Utilities.getUuid();
  const rows=Object.keys(merged).map(function(key){return merged[key]});
  let totalAdded=0;
  const people={};

  rows.forEach(function(item,index){
    const result=updateDebt_({nickname:item.nickname,debtType:item.type,amount:item.count,mode:'add'},false);
    logDebt_(item.nickname,item.type,result.beforeCount,result.newCount,batchId+':'+index);
    totalAdded+=item.count;
    people[item.nickname]=true;
  });

  return{
    batchId:batchId,
    people:Object.keys(people).length,
    types:rows.length,
    totalAdded:totalAdded,
    source:text_(p.source)||'룰렛'
  };
}
function batchPrefix_(actionId){
  const id=text_(actionId);
  const match=id.match(/^(batch-[^:]+):\d+$/);
  return match?match[1]:'';
}
function undoLastBatch_(){
  const s=sh_(SHEETS.log);
  if(s.getLastRow()<2)throw new Error('되돌릴 일괄 등록이 없습니다.');
  const vals=s.getRange(2,1,s.getLastRow()-1,7).getValues();
  let prefix='';
  for(let i=vals.length-1;i>=0;i--){
    if(!vals[i][6]&&batchPrefix_(vals[i][1])){prefix=batchPrefix_(vals[i][1]);break}
  }
  if(!prefix)throw new Error('되돌릴 일괄 등록이 없습니다.');

  const targets=[];
  vals.forEach(function(row,index){
    if(!row[6]&&batchPrefix_(row[1])===prefix){
      targets.push({sheetRow:index+2,nickname:row[2],type:row[3],before:Number(row[4])||0});
    }
  });
  targets.slice().reverse().forEach(function(item){
    updateDebt_({nickname:item.nickname,debtType:item.type,amount:item.before,mode:'set'},false);
    s.getRange(item.sheetRow,7).setValue(true);
  });
  return{batchId:prefix,items:targets.length};
}
function listBatches_(){
  const s=sh_(SHEETS.log);
  if(s.getLastRow()<2)return[];
  const vals=s.getRange(2,1,s.getLastRow()-1,7).getValues();
  const map={};
  vals.forEach(function(row){
    const prefix=batchPrefix_(row[1]);
    if(!prefix||row[6])return;
    if(!map[prefix])map[prefix]={batchId:prefix,people:{},types:0,totalAdded:0,date:new Date(row[0])};
    const batch=map[prefix];
    batch.people[text_(row[2])]=true;
    batch.types++;
    batch.totalAdded+=Math.max(0,(Number(row[5])||0)-(Number(row[4])||0));
    if(new Date(row[0])>batch.date)batch.date=new Date(row[0]);
  });
  return Object.keys(map).map(function(key){
    const b=map[key];
    return{batchId:b.batchId,people:Object.keys(b.people).length,types:b.types,totalAdded:b.totalAdded,time:Utilities.formatDate(b.date,Session.getScriptTimeZone(),'MM/dd HH:mm')};
  }).sort(function(a,b){return a.batchId<b.batchId?1:-1}).slice(0,8);
}


function ensureBroadcastSheets_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let reports=ss.getSheetByName(SHEETS.reports);
  if(!reports){
    reports=ss.insertSheet(SHEETS.reports);
    reports.appendRow(['reportId','date','title','startedAt','endedAt','durationMinutes','added','completed','newFans','newHonyo','currentDebts','topFansJson','topTypesJson','memo','startMemo']);
    reports.setFrozenRows(1);
  }
  let clips=ss.getSheetByName(SHEETS.clips);
  if(!clips){
    clips=ss.insertSheet(SHEETS.clips);
    clips.appendRow(['createdAt','reportId','timecode','category','memo']);
    clips.setFrozenRows(1);
  }
}
function countRows_(sheetName){
  const s=sh_(sheetName);
  return Math.max(0,s.getLastRow()-1);
}
function currentDebtTotal_(){
  const s=sh_(SHEETS.debts);if(s.getLastRow()<2)return 0;
  const h=heads_(s),cc=col_(h,['개수','count']);
  return s.getRange(2,cc,s.getLastRow()-1,1).getValues().reduce((sum,row)=>sum+(Number(row[0])||0),0);
}
function activeBroadcast_(){
  const raw=PropertiesService.getScriptProperties().getProperty('ACTIVE_BROADCAST');
  if(!raw)return null;
  try{return JSON.parse(raw)}catch(e){return null}
}
function startBroadcast_(p){
  ensureBroadcastSheets_();
  if(activeBroadcast_())throw new Error('이미 진행 중인 방송이 있습니다.');
  const now=new Date();
  const state={
    active:true,
    sessionId:'session-'+Utilities.getUuid(),
    title:text_(p.title)||'방송',
    startMemo:text_(p.memo),
    startedAtIso:now.toISOString(),
    startedAt:Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm'),
    fanCount:countRows_(SHEETS.fans),
    honyoCount:countRows_(SHEETS.honyo),
    debtTotal:currentDebtTotal_()
  };
  PropertiesService.getScriptProperties().setProperty('ACTIVE_BROADCAST',JSON.stringify(state));
  return state;
}
function logsSince_(date){
  const s=sh_(SHEETS.log);if(s.getLastRow()<2)return[];
  return s.getRange(2,1,s.getLastRow()-1,7).getValues().filter(row=>new Date(row[0])>=date&&!row[6]);
}
function endBroadcast_(p){
  ensureBroadcastSheets_();
  const state=activeBroadcast_();
  if(!state)throw new Error('진행 중인 방송이 없습니다.');

  const start=new Date(state.startedAtIso),end=new Date();
  const logs=logsSince_(start);
  let added=0,completed=0;
  const fanAdds={},typeAdds={};

  logs.forEach(row=>{
    const nickname=text_(row[2]),type=text_(row[3]);
    const before=Number(row[4])||0,after=Number(row[5])||0;
    const delta=after-before;
    if(delta>0){
      added+=delta;
      fanAdds[nickname]=(fanAdds[nickname]||0)+delta;
      typeAdds[type]=(typeAdds[type]||0)+delta;
    }else if(delta<0){
      completed+=Math.abs(delta);
    }
  });

  const topFans=Object.keys(fanAdds).map(name=>({name:name,count:fanAdds[name]})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'ko')).slice(0,10);
  const topTypes=Object.keys(typeAdds).map(name=>({name:name,count:typeAdds[name]})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'ko')).slice(0,10);
  const newFans=Math.max(0,countRows_(SHEETS.fans)-(Number(state.fanCount)||0));
  const newHonyo=Math.max(0,countRows_(SHEETS.honyo)-(Number(state.honyoCount)||0));
  const currentDebts=currentDebtTotal_();
  const durationMinutes=Math.max(1,Math.round((end-start)/60000));
  const reportId='report-'+Utilities.getUuid();
  const date=Utilities.formatDate(end,Session.getScriptTimeZone(),'yyyy-MM-dd');
  const startedAt=Utilities.formatDate(start,Session.getScriptTimeZone(),'HH:mm');
  const endedAt=Utilities.formatDate(end,Session.getScriptTimeZone(),'HH:mm');

  sh_(SHEETS.reports).appendRow([
    reportId,date,state.title,state.startedAtIso,end.toISOString(),durationMinutes,
    added,completed,newFans,newHonyo,currentDebts,
    JSON.stringify(topFans),JSON.stringify(topTypes),text_(p.memo),state.startMemo||''
  ]);
  const clipSheet=sh_(SHEETS.clips);
  if(clipSheet.getLastRow()>=2){const ids=clipSheet.getRange(2,2,clipSheet.getLastRow()-1,1).getValues();ids.forEach(function(row,index){if(text_(row[0])===state.sessionId)clipSheet.getRange(index+2,2).setValue(reportId)})}
  PropertiesService.getScriptProperties().deleteProperty('ACTIVE_BROADCAST');

  return{
    reportId,date,title:state.title,startedAt,endedAt,durationMinutes,added,completed,
    newFans,newHonyo,currentDebts,topFans,topTypes,memo:text_(p.memo)
  };
}
function parseJson_(value,fallback){
  try{return JSON.parse(text_(value)||'')}catch(e){return fallback}
}
function listReports_(){
  ensureBroadcastSheets_();
  const s=sh_(SHEETS.reports);if(s.getLastRow()<2)return[];
  const rows=s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues();
  return rows.slice().reverse().slice(0,20).map(row=>({
    reportId:text_(row[0]),date:text_(row[1]),title:text_(row[2]),
    startedAt:Utilities.formatDate(new Date(row[3]),Session.getScriptTimeZone(),'HH:mm'),
    endedAt:Utilities.formatDate(new Date(row[4]),Session.getScriptTimeZone(),'HH:mm'),
    durationMinutes:Number(row[5])||0,added:Number(row[6])||0,completed:Number(row[7])||0,
    newFans:Number(row[8])||0,newHonyo:Number(row[9])||0,currentDebts:Number(row[10])||0,
    topFans:parseJson_(row[11],[]),topTypes:parseJson_(row[12],[]),memo:text_(row[13])
  }));
}
function listClips_(){
  ensureBroadcastSheets_();
  const s=sh_(SHEETS.clips);if(s.getLastRow()<2)return[];
  return s.getRange(2,1,s.getLastRow()-1,5).getValues().slice().reverse().slice(0,30).map(row=>({
    createdAt:Utilities.formatDate(new Date(row[0]),Session.getScriptTimeZone(),'MM/dd HH:mm'),
    reportId:text_(row[1]),timecode:text_(row[2]),category:text_(row[3]),memo:text_(row[4])
  }));
}
function broadcastDashboard_(){
  ensureBroadcastSheets_();
  return{active:activeBroadcast_(),reports:listReports_(),clips:listClips_()};
}
function addClip_(p){
  ensureBroadcastSheets_();
  const timecode=text_(p.timecode),category=text_(p.category)||'클립',memo=text_(p.memo);
  if(!timecode||!memo)throw new Error('타임코드와 메모를 입력하세요.');
  const active=activeBroadcast_();
  const reportId=active?active.sessionId:'';
  sh_(SHEETS.clips).appendRow([new Date(),reportId,timecode,category,memo]);
  return{timecode:timecode,category:category,memo:memo};
}


function restoreBackup_(p){
  ensureBroadcastSheets_();
  let backup;
  try{backup=JSON.parse(text_(p.backupJson)||'{}')}catch(e){throw new Error('JSON 백업 파일을 읽지 못했습니다.')}
  if(!Array.isArray(backup.reports)||!Array.isArray(backup.clips))throw new Error('방송기록과 클립메모가 포함된 백업이 아닙니다.');
  backup.reports.forEach(function(r,index){
    if(!text_(r.date))throw new Error((index+1)+'번째 방송기록에 날짜가 없습니다.');
    if(!text_(r.title))r.title='방송';
  });
  backup.clips.forEach(function(c,index){
    if(!text_(c.timecode)&&!text_(c.memo))throw new Error((index+1)+'번째 클립메모가 비어 있습니다.');
  });
  if(backup.reports.length>2000||backup.clips.length>10000)throw new Error('복원 파일이 너무 큽니다.');

  const reportSheet=sh_(SHEETS.reports),clipSheet=sh_(SHEETS.clips);
  if(reportSheet.getLastRow()>1)reportSheet.getRange(2,1,reportSheet.getLastRow()-1,reportSheet.getLastColumn()).clearContent();
  if(clipSheet.getLastRow()>1)clipSheet.getRange(2,1,clipSheet.getLastRow()-1,clipSheet.getLastColumn()).clearContent();

  const reportRows=backup.reports.map(function(r){
    const startDate=r.startedAtIso||((r.date||'')+'T'+(r.startedAt||'00:00')+':00');
    const endDate=r.endedAtIso||((r.date||'')+'T'+(r.endedAt||'00:00')+':00');
    return[
      text_(r.reportId)||('report-'+Utilities.getUuid()),text_(r.date),text_(r.title)||'방송',
      startDate,endDate,Number(r.durationMinutes)||0,Number(r.added)||0,Number(r.completed)||0,
      Number(r.newFans)||0,Number(r.newHonyo)||0,Number(r.currentDebts)||0,
      JSON.stringify(r.topFans||[]),JSON.stringify(r.topTypes||[]),text_(r.memo),text_(r.startMemo)
    ];
  });
  if(reportRows.length)reportSheet.getRange(2,1,reportRows.length,15).setValues(reportRows);

  const clipRows=backup.clips.map(function(c){
    return[c.createdAt||new Date(),text_(c.reportId),text_(c.timecode),text_(c.category)||'클립',text_(c.memo)];
  });
  if(clipRows.length)clipSheet.getRange(2,1,clipRows.length,5).setValues(clipRows);

  return{reports:reportRows.length,clips:clipRows.length};
}

function listRecent_(){const s=sh_(SHEETS.log);if(s.getLastRow()<2)return[];const vals=s.getRange(2,1,s.getLastRow()-1,7).getValues();return vals.slice(-8).reverse().filter(r=>!r[6]).map(r=>({actionId:r[1],nickname:r[2],debtType:r[3],beforeCount:Number(r[4])||0,afterCount:Number(r[5])||0,time:Utilities.formatDate(new Date(r[0]),Session.getScriptTimeZone(),'MM/dd HH:mm')}))}
function undoLastDebt_(){const s=sh_(SHEETS.log);if(s.getLastRow()<2)throw new Error('되돌릴 작업이 없습니다.');const vals=s.getRange(2,1,s.getLastRow()-1,7).getValues();for(let i=vals.length-1;i>=0;i--){if(!vals[i][6]){const row=i+2,n=vals[i][2],t=vals[i][3],before=Number(vals[i][4])||0;updateDebt_({nickname:n,debtType:t,amount:before,mode:'set'},false);s.getRange(row,7).setValue(true);return{nickname:n,debtType:t,newCount:before}}}throw new Error('되돌릴 작업이 없습니다.')}
function saveHonyo_(p){const n=text_(p.nickname),img=text_(p.statementImage);if(!n||!img)throw new Error('닉네임과 사진 주소를 입력하세요.');ensureFan_(n,text_(p.fanId));const s=sh_(SHEETS.honyo),h=heads_(s),nc=col_(h,['nickname','닉네임']),ic=col_(h,['선언문사진','statementimage','이미지']),uc=col_(h,['updatedat','업데이트'],false),mc=col_(h,['메모','memo'],false);let row=0;if(s.getLastRow()>=2){const v=s.getRange(2,nc,s.getLastRow()-1,1).getDisplayValues();for(let x=0;x<v.length;x++)if(text_(v[x][0])===n){row=x+2;break}}if(!row)row=Math.max(2,s.getLastRow()+1);s.getRange(row,nc).setValue(n);s.getRange(row,ic).setValue(img);if(uc)s.getRange(row,uc).setValue(new Date());if(mc)s.getRange(row,mc).setValue(text_(p.memo));return{nickname:n}}
function nextOrder_(s,c){if(s.getLastRow()<2)return 1;let m=0;s.getRange(2,c,s.getLastRow()-1,1).getValues().forEach(r=>m=Math.max(m,Number(r[0])||0));return m+1}
function addNotice_(p){const s=sh_(SHEETS.notices),h=heads_(s),r=Math.max(2,s.getLastRow()+1);s.getRange(r,col_(h,['category','분류'])).setValue(text_(p.category)||'공지');s.getRange(r,col_(h,['title','제목'])).setValue(text_(p.title));s.getRange(r,col_(h,['content','내용'])).setValue(text_(p.content));const pc=col_(h,['pinned','고정'],false),vc=col_(h,['visible','표시'],false),oc=col_(h,['order','순서'],false);if(pc)s.getRange(r,pc).setValue(text_(p.pinned));if(vc)s.getRange(r,vc).setValue('표시');if(oc)s.getRange(r,oc).setValue(nextOrder_(s,oc));return{row:r}}
function addSchedule_(p){const s=sh_(SHEETS.schedule),h=heads_(s),r=Math.max(2,s.getLastRow()+1);s.getRange(r,col_(h,['date','날짜'])).setValue(new Date(text_(p.date)+'T00:00:00'));s.getRange(r,col_(h,['time','시간'])).setValue(text_(p.time));s.getRange(r,col_(h,['title','제목'])).setValue(text_(p.title));s.getRange(r,col_(h,['type','종류'])).setValue(text_(p.type)||'방송');const mc=col_(h,['memo','메모'],false),vc=col_(h,['visible','표시'],false);if(mc)s.getRange(r,mc).setValue(text_(p.memo));if(vc)s.getRange(r,vc).setValue('표시');return{row:r}}
function saveGame_(p){const s=sh_(SHEETS.games),h=heads_(s),tc=col_(h,['title','게임명','제목']),title=text_(p.title);let row=0;if(s.getLastRow()>=2){const v=s.getRange(2,tc,s.getLastRow()-1,1).getDisplayValues();for(let x=0;x<v.length;x++)if(text_(v[x][0]).toLowerCase()===title.toLowerCase()){row=x+2;break}}if(!row)row=Math.max(2,s.getLastRow()+1);s.getRange(row,tc).setValue(title);s.getRange(row,col_(h,['status','상태'])).setValue(text_(p.status)||'할 게임');const map=[[['image','이미지'],p.image],[['progress','진행도'],p.progress],[['progresspercent','진행률','퍼센트'],int_(p.progressPercent||0,true)],[['memo','메모'],p.memo]];map.forEach(x=>{const c=col_(h,x[0],false);if(c)s.getRange(row,c).setValue(x[1])});const oc=col_(h,['order','순서'],false);if(oc&&!s.getRange(row,oc).getValue())s.getRange(row,oc).setValue(nextOrder_(s,oc));return{row,title}}
