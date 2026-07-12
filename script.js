
function validateBroadcastConfig(){
  const cfg=window.BROADCAST_PAGE_CONFIG||{};
  const problems=[];
  if(!String(cfg.spreadsheetId||'').trim())problems.push('구글시트 ID가 비어 있어요.');
  if(!cfg.sheets||typeof cfg.sheets!=='object')problems.push('시트 이름 설정이 없어요.');
  const required=['fanInfo','currentDebts','honyodan','games','notices','schedule','settings','reports','clips'];
  required.forEach(key=>{if(!cfg.sheets?.[key])problems.push(`${key} 시트 이름이 비어 있어요.`)});
  return {ok:problems.length===0,problems};
}
function renderSetupWarning(){
  const result=validateBroadcastConfig();
  let box=document.getElementById('setupWarning');
  if(!box){
    box=document.createElement('div');
    box.id='setupWarning';
    box.className='setup-warning';
    const target=document.querySelector('main')||document.body;
    target.prepend(box);
  }
  box.hidden=result.ok;
  box.innerHTML=result.ok?'':`<b>설정이 아직 끝나지 않았어요.</b><span>${result.problems.map(esc).join('<br>')}</span><a href="setup.html">설정 페이지 열기</a>`;
}

const SAMPLE_DATA = {
  fans:[
    {id:'id-yeobam',nickname:'여밤',avatar:''},{id:'id-gaja',nickname:'가자',avatar:''},
    {id:'id-reumbi',nickname:'름비',avatar:''},{id:'id-toegeun',nickname:'퇴근',avatar:''},
    {id:'id-love',nickname:'러브',avatar:''},{id:'id-yard',nickname:'야드',avatar:''}
  ],
  debts:[
    {id:'id-yeobam',type:'일반프사',count:1,updatedAt:'2026-07-10T10:00:00'},
    {id:'id-gaja',type:'매도',count:1,updatedAt:'2026-07-10T14:00:00'},
    {id:'id-gaja',type:'원하는 대사',count:1,updatedAt:'2026-07-10T14:00:00'},
    {id:'id-gaja',type:'애교',count:2,updatedAt:'2026-07-10T14:00:00'},
    {id:'id-gaja',type:'포스트잇',count:1,updatedAt:'2026-07-10T14:00:00'},
    {id:'id-gaja',type:'플로팅배너',count:1,updatedAt:'2026-07-10T14:00:00'},
    {id:'id-reumbi',type:'원하는 대사',count:1,updatedAt:'2026-07-09T20:00:00'},
    {id:'id-toegeun',type:'원하는 대사',count:2,updatedAt:'2026-07-09T18:00:00'},
    {id:'id-love',type:'시참권(3판)',count:1,updatedAt:'2026-07-08T18:00:00'},
    {id:'id-yard',type:'시참권(3판)',count:3,updatedAt:'2026-07-08T16:00:00'}
  ],
  honyodan:[{id:'id-gaja',statementImage:''},{id:'id-love',statementImage:''},{id:'id-yard',statementImage:''}],
  notices:[
    {category:'공지',title:'구글시트 연동 준비 완료',content:'config.js에 스프레드시트 ID를 넣으면 실제 데이터가 표시돼요.',order:1,pinned:true},
    {category:'업데이트',title:'현재는 샘플 데이터입니다',content:'연결 후에는 구글시트 내용으로 자동 교체됩니다.',order:2,pinned:false}
  ],
  games:[
    {title:'레드 데드 리뎀션 2',status:'playing',progress:'진행 중',memo:'장기 방송',image:'',icon:'🤠',order:1},
    {title:'성세천하 2',status:'planned',progress:'예정',memo:'모든 엔딩 목표',image:'',icon:'👑',order:2},
    {title:'데이브 더 다이버',status:'planned',progress:'예정',memo:'',image:'',icon:'🤿',order:3},
    {title:'바이오하자드 RE4',status:'done',progress:'완료',memo:'',image:'',icon:'🧟',order:4},
    {title:'산나비',status:'done',progress:'완료',memo:'',image:'',icon:'🦾',order:5}
  ],
  schedule:[
    {date:'2026-07-11',time:'20:00',title:'노래 방송',memo:'신청곡 받기',type:'방송'},
    {date:'2026-07-13',time:'휴방',title:'정기 휴방',memo:'다음 방송에서 만나요',type:'휴방'},
    {date:'2026-07-15',time:'21:00',title:'게임 방송',memo:'레드 데드 리뎀션 2',type:'방송'},
    {date:'2026-07-18',time:'20:00',title:'룰렛 이벤트',memo:'업보 적립의 날',type:'이벤트'}
  ],
  reports:[
    {reportId:'sample-1',date:'2026-07-12',title:'노래 방송',startedAt:'20:00',endedAt:'23:10',durationMinutes:190,added:12,completed:4,newFans:2,newHonyo:1,currentDebts:31,topFans:[{name:'가자',count:5},{name:'여밤',count:4}],topTypes:[{name:'애교',count:5},{name:'매도',count:3}],memo:'신청곡과 룰렛 진행'},
    {reportId:'sample-2',date:'2026-07-16',title:'게임 방송',startedAt:'21:00',endedAt:'01:20',durationMinutes:260,added:8,completed:2,newFans:1,newHonyo:0,currentDebts:37,topFans:[{name:'야드',count:3}],topTypes:[{name:'시참권(3판)',count:3}],memo:'레드 데드 리뎀션 2 진행'}
  ],
  clips:[{reportId:'sample-1',timecode:'01:13:25',category:'애교',memo:'애교하다 웃음 터짐'}],
  settings:{}
};

let data = structuredClone(SAMPLE_DATA);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const value = (row, ...keys) => {
  for (const key of keys) {
    const found = Object.keys(row).find(k => k.trim().toLowerCase() === String(key).trim().toLowerCase());
    if (found !== undefined && row[found] !== '') return row[found];
  }
  return '';
};

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else {
      if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const headers = (rows.shift() || []).map(h => h.trim());
  return rows
    .filter(r => r.some(cell => String(cell).trim() !== ''))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, String(r[i] ?? '').trim()])));
}

function csvUrl(spreadsheetId, sheetName) {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

async function fetchSheet(spreadsheetId, sheetName) {
  const response = await fetch(csvUrl(spreadsheetId, sheetName), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${sheetName} 시트를 불러오지 못했습니다 (${response.status})`);
  return parseCsv(await response.text());
}

function normalizeGameStatus(raw) {
  const status = String(raw || '').trim();
  if (['하는 중','진행중','playing'].includes(status)) return 'playing';
  if (['할 게임','예정','planned'].includes(status)) return 'planned';
  if (['했던 게임','완료','done'].includes(status)) return 'done';
  return 'planned';
}

function gameProgressPercent(game) {
  const direct = Number(game?.progressPercent || 0);
  if (Number.isFinite(direct) && direct > 0) return Math.max(0,Math.min(100,direct));
  const text = String(game?.progress || '');
  const percent = text.match(/(\d{1,3})\s*%/);
  if (percent) return Math.max(0,Math.min(100,Number(percent[1])));
  if (game?.status === 'done') return 100;
  return 0;
}
function gameStatusLabel(status) {
  return status === 'playing' ? '하는 중' : status === 'done' ? '했던 게임' : '할 게임';
}
function gameIcon(title='') {
  const t=String(title).toLowerCase();
  if(t.includes('레드 데드')||t.includes('red dead')) return '🤠';
  if(t.includes('바이오')||t.includes('resident')) return '🧟';
  if(t.includes('산나비')) return '🦾';
  if(t.includes('다이버')||t.includes('dave')) return '🤿';
  if(t.includes('공포')||t.includes('호러')) return '👻';
  if(t.includes('퍼피')||t.includes('강아지')) return '🐶';
  return '🎮';
}

function visibleRow(row) {
  const visible = String(value(row, 'visible', '표시')).trim();
  return !['숨김','false','0','no'].includes(visible.toLowerCase());
}


function normalizeImageUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) return '';

  // Google Drive 공유 주소와 uc 주소에서 파일 ID 추출
  const drivePatterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/
  ];
  for (const pattern of drivePatterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1600`;
    }
  }

  // Google Photos/기타 직접 이미지 주소는 그대로 사용
  return url;
}


function parseJsonValue(raw,fallback=[]){if(Array.isArray(raw))return raw;try{return JSON.parse(String(raw||''))}catch{return fallback}}
function normalizeReportDate(raw){const text=String(raw||'').trim();if(!text)return '';const date=new Date(text);if(!Number.isNaN(date.getTime())){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}const match=text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);return match?`${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`:text}

function mapSheetData(raw) {
  const fans = raw.fanInfo.map(r => ({
    id: value(r, 'id', '아이디'),
    nickname: value(r, 'nickname', '닉네임'),
    avatar: normalizeImageUrl(value(r, 'avatar', '프로필사진', '프로필 이미지')),
    color: value(r, 'color', '대표색', 'profileColor', '프로필색')
  })).filter(f => f.nickname).map(f=>({...f,key:f.id||`nick:${f.nickname}`}));

  const debts = raw.currentDebts.map(r => {
    const nickname = value(r, 'nickname', '닉네임', '메모');
    const id = value(r, 'id', '아이디');
    return {
      id,
      nickname,
      key: nickname ? `nick:${nickname}` : id,
      type: value(r, '업보종류', 'type', '종류'),
      count: Number(value(r, '개수', 'count') || 0),
      updatedAt: value(r, 'updatedAt', '업데이트')
    };
  }).filter(d => d.key && d.type && d.count > 0);

  const honyodan = raw.honyodan.map(r => {
    const nickname = value(r, 'nickname', '닉네임');
    const id = value(r, 'id', '아이디');
    return {
      id,
      nickname,
      key: nickname ? `nick:${nickname}` : id,
      statementImage: normalizeImageUrl(value(r, '선언문사진', 'statementImage', '이미지')),
      updatedAt: value(r, 'updatedAt', '업데이트')
    };
  }).filter(h => h.key);

  const games = raw.games.map(r => ({
    title: value(r, 'title', '게임명', '제목'),
    status: normalizeGameStatus(value(r, 'status', '상태')),
    image: normalizeImageUrl(value(r, 'image', '이미지')),
    progress: value(r, 'progress', '진행도'),
    progressPercent: Number(value(r, 'progressPercent', '진행률', '퍼센트') || 0),
    memo: value(r, 'memo', '메모'),
    order: Number(value(r, 'order', '순서') || 999),
    icon: '🎮'
  })).filter(g => g.title).map(g=>({...g,progressPercent:gameProgressPercent(g)})).sort((a,b) => a.order - b.order);

  const notices = raw.notices.filter(visibleRow).map(r => {
    const pinnedRaw = String(value(r, 'pinned', '고정', '중요') || '').trim().toLowerCase();
    return {
      category: value(r, 'category', '분류') || '공지',
      title: value(r, 'title', '제목'),
      content: value(r, 'content', '내용'),
      pinned: ['고정','true','1','yes','y'].includes(pinnedRaw),
      order: Number(value(r, 'order', '순서') || 999)
    };
  }).filter(n => n.title).sort((a,b) => Number(b.pinned)-Number(a.pinned) || a.order-b.order);

  const schedule = raw.schedule.filter(visibleRow).map(r => {
    const rawDate = value(r, 'date', '날짜');
    const parsedDate = parseScheduleDate(rawDate);
    return {
      rawDate,
      date: formatScheduleDate(parsedDate, rawDate),
      timestamp: parsedDate ? parsedDate.getTime() : Number.MAX_SAFE_INTEGER,
      time: value(r, 'time', '시간'),
      title: value(r, 'title', '제목'),
      memo: value(r, 'memo', '메모'),
      type: value(r, 'type', '종류')
    };
  }).filter(s => s.date || s.title).sort((a,b)=>a.timestamp-b.timestamp);

  const settings = Object.fromEntries(raw.settings.map(r => [value(r, 'key', '항목'), value(r, 'value', '값')]).filter(([k]) => k));
  const reports=(raw.reports||[]).map(r=>({
    reportId:value(r,'reportId','리포트ID'),
    date:normalizeReportDate(value(r,'date','날짜')),
    title:value(r,'title','제목')||'방송',
    startedAt:value(r,'startedAt','시작시간'),
    endedAt:value(r,'endedAt','종료시간'),
    durationMinutes:Number(value(r,'durationMinutes','방송시간')||0),
    added:Number(value(r,'added','업보추가')||0),
    completed:Number(value(r,'completed','업보완료')||0),
    newFans:Number(value(r,'newFans','신규팬')||0),
    newHonyo:Number(value(r,'newHonyo','신규호뇽단')||0),
    currentDebts:Number(value(r,'currentDebts','현재업보')||0),
    topFans:parseJsonValue(value(r,'topFansJson','topFans'),[]),
    topTypes:parseJsonValue(value(r,'topTypesJson','topTypes'),[]),
    memo:value(r,'memo','메모')
  })).filter(r=>r.date).sort((a,b)=>b.date.localeCompare(a.date));

  const clips=(raw.clips||[]).map(r=>({
    reportId:value(r,'reportId','리포트ID'),
    timecode:value(r,'timecode','타임코드'),
    category:value(r,'category','분류'),
    memo:value(r,'memo','메모')
  })).filter(c=>c.timecode||c.memo);

  return {fans,debts,honyodan,games,notices,schedule,reports,clips,settings};
}

function parseScheduleDate(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  let date = new Date(str);
  if (!Number.isNaN(date.getTime())) {
    date.setHours(0,0,0,0);
    return date;
  }
  const md = str.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (md) {
    date = new Date(new Date().getFullYear(), Number(md[1])-1, Number(md[2]));
    date.setHours(0,0,0,0);
    return date;
  }
  return null;
}
function formatScheduleDate(date, raw='') {
  if (!date) return String(raw || '');
  const weekday = ['일','월','화','수','목','금','토'][date.getDay()];
  return `${date.getMonth()+1}/${date.getDate()} (${weekday})`;
}
function dayStart(date=new Date()) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d;
}
function sameDay(a,b) {
  return a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function weekLabel(timestamp) {
  if (!Number.isFinite(timestamp) || timestamp===Number.MAX_SAFE_INTEGER) return '날짜 미정';
  const d = new Date(timestamp);
  const today = dayStart();
  const diff = Math.floor((dayStart(d)-today)/86400000);
  if (diff >= 0 && diff <= 6) return '이번 주';
  if (diff >= 7 && diff <= 13) return '다음 주';
  return `${d.getMonth()+1}월 일정`;
}

function setSyncStatus(message, state='loading') {
  const el = $('syncStatus');
  if (!el) return;
  el.textContent = message;
  el.dataset.state = state;
}

async function loadGoogleSheets() {
  const config = window.BROADCAST_PAGE_CONFIG || {};
  const id = String(config.spreadsheetId || '').trim();
  if (!id) {
    setSyncStatus('샘플 데이터 표시 중 · config.js에 구글시트 ID를 입력하세요', 'sample');
    const last = $('lastSync'); if (last) last.textContent = '구글시트 ID가 아직 설정되지 않았어요.';
    return;
  }
  setSyncStatus('구글시트 불러오는 중…', 'loading');
  try {
    const s = config.sheets || {};
    const [fanInfo,currentDebts,honyodan,games,notices,schedule,settings,reports,clips] = await Promise.all([
      fetchSheet(id,s.fanInfo||'팬정보'),fetchSheet(id,s.currentDebts||'현재업보'),fetchSheet(id,s.honyodan||'호뇽단'),fetchSheet(id,s.games||'게임'),fetchSheet(id,s.notices||'공지'),fetchSheet(id,s.schedule||'스케줄표'),fetchSheet(id,s.settings||'설정'),fetchSheet(id,s.reports||'방송기록'),fetchSheet(id,s.clips||'클립메모')
    ]);
    data=mapSheetData({fanInfo,currentDebts,honyodan,games,notices,schedule,settings,reports,clips});
    applySettings();
    renderAll();
    const now = new Date();
    setSyncStatus(`구글시트 연결됨 · ${now.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 갱신`, 'connected');
    const last = $('lastSync'); if (last) last.textContent = `마지막 동기화: ${now.toLocaleString('ko-KR')}`;
  } catch (error) {
    console.error(error);
    if (config.useSampleDataOnError !== false) {
      data = structuredClone(SAMPLE_DATA);
      renderAll();
      setSyncStatus(`연결 실패 · 샘플 데이터 표시 중 (${error.message})`, 'error');
    } else {
      setSyncStatus(`구글시트 연결 실패: ${error.message}`, 'error');
    }
  }
}

function applySettings() {
  const s = data.settings || {};
  if (s.siteName) {
    document.title = s.siteName;
    document.querySelector('.brand b').textContent = s.siteName;
    document.querySelector('footer b').textContent = s.siteName;
  }
  if (s.intro) document.querySelector('.hero-copy p').textContent = s.intro;
}

function personKey(person){return person?.key || person?.id || (person?.nickname ? `nick:${person.nickname}` : '')}
function fanByKey(key){
  return data.fans.find(f=>personKey(f)===key) || (()=>{
    const debt=data.debts.find(d=>(d.key||d.id)===key);
    const h=data.honyodan.find(x=>(x.key||x.id)===key);
    const nickname=debt?.nickname || h?.nickname || String(key||'').replace(/^nick:/,'');
    return nickname ? {id:debt?.id||h?.id||'',nickname,avatar:debt?.avatar||h?.avatar||'',color:debt?.color||h?.color||'',key} : null;
  })();
}
function avatarSeed(text=''){
  let hash=0;
  for(const ch of String(text)){hash=((hash<<5)-hash)+ch.charCodeAt(0);hash|=0}
  return Math.abs(hash);
}
function normalizeHexColor(value){
  const color=String(value||'').trim();
  if(/^#[0-9a-f]{6}$/i.test(color)) return color;
  if(/^#[0-9a-f]{3}$/i.test(color)) return '#'+color.slice(1).split('').map(x=>x+x).join('');
  return '';
}
function autoAvatarColors(person){
  const palettes=[
    ['#F7B7D0','#9D4F76'],['#C9B8F4','#604A9A'],['#B7DDF4','#3F6F96'],
    ['#BDE8D0','#3E7D5B'],['#F7D8A8','#91652D'],['#F3BFB6','#945246'],
    ['#D5C5F0','#67558D'],['#BFE5E1','#437A76'],['#F5C8E1','#944F79']
  ];
  const seed=avatarSeed(person?.id||person?.nickname||'?');
  const auto=palettes[seed%palettes.length];
  const chosen=normalizeHexColor(person?.color);
  return chosen?[chosen,'#FFFFFF']:auto;
}
function avatar(person,size='normal'){
  const letter=esc((person?.nickname||'?').trim().slice(0,1)||'?');
  const [background,foreground]=autoAvatarColors(person);
  const fallback=`<span class="avatar-letter" style="--avatar-bg:${background};--avatar-fg:${foreground}">${letter}</span>`;
  if(!person?.avatar) return fallback;
  return `<img src="${esc(person.avatar)}" alt="${esc(person.nickname||'팬')} 프로필 사진" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="avatar-letter" style="--avatar-bg:${background};--avatar-fg:${foreground}" hidden>${letter}</span>`;
}
function groupedFans(){
  const keys=new Set([
    ...data.fans.map(personKey).filter(Boolean),
    ...data.debts.map(d=>d.key||d.id).filter(Boolean),
    ...data.honyodan.map(h=>h.key||h.id).filter(Boolean)
  ]);
  return [...keys].map(key=>{
    const f=fanByKey(key); if(!f) return null;
    const ds=data.debts.filter(d=>(d.key||d.id)===key);
    const h=data.honyodan.find(x=>(x.key||x.id)===key);
    return {...f,key,debts:ds,total:ds.reduce((a,d)=>a+Number(d.count||0),0),updatedAt:Math.max(0,...ds.map(d=>new Date(d.updatedAt||0).getTime())),honyo:Boolean(h)};
  }).filter(f=>f&&(f.total||f.honyo));
}
function debtBadgeHtml(debts,limit=4){
  const shown=debts.slice(0,limit);
  const rest=Math.max(0,debts.length-limit);
  return shown.map(d=>`<span class="badge">${esc(d.type)} ×${Number(d.count)}</span>`).join('')+
    (rest?`<span class="badge badge-more">외 ${rest}종</span>`:'');
}
function personCard(f,mode='debt'){
  return `<article class="${mode==='honyo'?'honyo-card':'fan-card'}" data-id="${esc(f.key||f.id)}">
    <div class="person-row"><div class="avatar">${avatar(f)}</div><div class="person-copy"><b>${esc(f.nickname)}</b><small>${f.id?'@'+esc(f.id):'닉네임 기준'}</small></div></div>
    ${mode==='debt'?`<div class="count-row"><span>보유 업보</span><b>${f.total}개</b></div><div class="badges">${debtBadgeHtml(f.debts)}</div>`:`<div class="badges"><span class="badge purple">본진선언문 보기</span></div>`}
  </article>`;
}
function filteredDebtFans(){
  const q=$('debtSearch').value.trim().toLowerCase();
  const typeFilter=$('debtTypeFilter')?.value||'';
  const sort=$('debtSort').value||'name';
  let list=groupedFans().filter(f=>f.total>0)
    .filter(f=>!q||f.nickname.toLowerCase().includes(q)||String(f.id||'').toLowerCase().includes(q))
    .filter(f=>!typeFilter||f.debts.some(d=>d.type===typeFilter));
  list.sort((a,b)=>sort==='count'?b.total-a.total:sort==='recent'?(b.updatedAt-a.updatedAt||a.nickname.localeCompare(b.nickname,'ko')):a.nickname.localeCompare(b.nickname,'ko'));
  return {list,typeFilter};
}
function renderDebts(){
  debtTypeOptions();
  const {list,typeFilter}=filteredDebtFans();
  $('totalDebt').textContent=data.debts.reduce((a,d)=>a+Number(d.count||0),0);
  $('debtGrid').innerHTML=list.length?list.map(f=>{
    const shown=typeFilter?{...f,debts:f.debts.filter(d=>d.type===typeFilter)}:f;
    return personCard(shown);
  }).join(''):'<div class="empty">검색 결과가 없어요.</div>';
  applyDebtViewMode();
  document.querySelectorAll('.fan-card').forEach(el=>el.onclick=()=>openProfile(el.dataset.id));
}
function fanShareUrl(f){
  const url=new URL(location.href);
  url.hash='search';
  url.searchParams.set('fan',f.nickname);
  return url.toString();
}
async function shareFan(id){
  const f=groupedFans().find(x=>(x.key||x.id)===id); if(!f)return;
  const url=fanShareUrl(f);
  const feedback=$('shareFeedback');
  try{
    if(navigator.share){await navigator.share({title:`${f.nickname}님의 방송 정보`,text:`${f.nickname}님의 업보와 호뇽단 정보를 확인해 보세요.`,url}); if(feedback)feedback.textContent='공유 창을 열었어요.';}
    else{await navigator.clipboard.writeText(url); if(feedback)feedback.textContent='링크를 복사했어요.';}
  }catch(error){if(error?.name!=='AbortError'&&feedback)feedback.textContent='복사하지 못했어요. 주소창 링크를 복사해 주세요.';}
}
window.shareFan=shareFan;
function openProfile(id){
  const f=groupedFans().find(x=>(x.key||x.id)===id); if(!f)return;
  const h=data.honyodan.find(x=>(x.key||x.id)===id);
  const history=fanHistory(f.nickname);
  const seasonHistory=seasonFanHistory(f.nickname);
  const recentReports=(data.reports||[]).filter(r=>(r.topFans||[]).some(row=>row.name===f.nickname)).slice(0,5);
  $('profileDialogBody').innerHTML=`<div class="dialog-body">
    <div class="dialog-profile"><div class="avatar">${avatar(f)}</div><div><h2 style="margin:0">${esc(f.nickname)}</h2><div style="color:var(--muted)">${f.id?'@'+esc(f.id):'닉네임 기준'} · 업보 ${f.total}개</div></div></div>
    <div class="fan-badges">${fanBadgesHtml(f)||'<span class="fan-achievement purple">🌱 새싹 팬</span>'}</div>
    <div class="profile-history-grid"><div><span>기록된 총 업보</span><b>${history.totalAdded}</b></div><div><span>방송 등장</span><b>${history.appearances}회</b></div><div><span>현재 남은 업보</span><b>${f.total}</b></div></div>
    <div class="profile-summary"><div><b>현재 보유 업보</b><div class="badges" style="margin-top:10px">${debtBadgeHtml(f.debts,99)||'<span class="badge">업보 없음</span>'}</div></div><div>${h?'<span class="badge purple">호뇽단</span>':'<span class="badge">일반 팬</span>'}</div></div>
    <div class="debt-list">${f.debts.length?f.debts.map(d=>`<div class="debt-item"><b>${esc(d.type)}</b><span>× ${Number(d.count)}</span></div>`).join(''):'<div class="empty">현재 업보가 없어요.</div>'}</div>
    <div class="profile-timeline">${recentReports.length?recentReports.map(r=>`<div class="profile-timeline-row"><time>${esc(r.date)}</time><span>${esc(r.title)} · +${(r.topFans||[]).find(x=>x.name===f.nickname)?.count||0}개</span></div>`).join(''):'<div class="empty">방송 활동 기록이 아직 없어요.</div>'}</div>
    <div class="profile-actions">${h?`<button class="statement-button" onclick="openStatement('${esc(id)}')">본진선언문 보기</button>`:''}<button class="share-button" onclick="shareFan('${esc(id)}')">이 팬 링크 공유</button></div>
    <div id="shareFeedback" class="share-feedback"></div>
  </div>`;
  $('profileDialog').showModal();
}
window.openProfile=openProfile;
window.openStatement=function(id){
  const f=fanByKey(id); const h=data.honyodan.find(x=>(x.key||x.id)===id); if(!f||!h)return;
  $('statementDialogBody').innerHTML=`<div class="dialog-body"><div class="dialog-profile"><div class="avatar">${avatar(f)}</div><div><h2 style="margin:0">${esc(f.nickname)}</h2><div style="color:var(--muted)">${f.id?'@'+esc(f.id):'닉네임 기준'} · 호뇽단</div></div></div><div style="margin-top:22px">${h.statementImage?`<img class="statement-image" src="${esc(h.statementImage)}" alt="${esc(f.nickname)} 본진선언문" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="statement-placeholder" hidden>사진을 불러오지 못했어요.<br>드라이브 공유 권한을 ‘링크가 있는 모든 사용자’로 확인해주세요.</div>`:'<div class="statement-placeholder">본진선언문 사진 주소를<br>구글시트에 넣으면 여기에 표시돼요.</div>'}</div></div>`;
  $('profileDialog').close(); $('statementDialog').showModal();
}
function renderHonyo(){
  const q=$('honyoSearch').value.trim().toLowerCase();
  const list=data.honyodan.map(h=>fanByKey(h.key||h.id)).filter(Boolean).filter(f=>!q||f.nickname.toLowerCase().includes(q)||String(f.id||'').toLowerCase().includes(q));
  $('honyoCount').textContent=data.honyodan.length;
  $('honyoGrid').innerHTML=list.length?list.sort((a,b)=>a.nickname.localeCompare(b.nickname,'ko')).map(f=>personCard({...f,honyo:true},'honyo')).join(''):'<div class="empty">검색 결과가 없어요.</div>';
  document.querySelectorAll('.honyo-card').forEach(el=>el.onclick=()=>openStatement(el.dataset.id));
}
function globalSearch(){
  const q=$('globalSearch').value.trim().toLowerCase();
  if(!q){$('searchResults').innerHTML='<div class="empty">검색어를 입력해 주세요.</div>';return}
  const fans=groupedFans().filter(f=>f.nickname.toLowerCase().includes(q)||String(f.id||'').toLowerCase().includes(q)||f.debts.some(d=>d.type.toLowerCase().includes(q)));
  const reports=(data.reports||[]).filter(r=>`${r.title} ${r.memo||''} ${r.date}`.toLowerCase().includes(q));
  const fanHtml=fans.length?`<h3 class="search-group-title">팬·업보</h3><div class="card-grid">${fans.map(f=>`<article class="result-card" data-id="${esc(f.key||f.id)}"><div class="person-row"><div class="avatar">${avatar(f)}</div><div class="person-copy"><b>${esc(f.nickname)}</b><small>${f.id?'@'+esc(f.id):'닉네임 기준'}</small></div></div><div class="fan-badges">${fanBadgesHtml(f)}</div><div class="result-summary"><span class="badge">업보 ${f.total}개</span>${f.honyo?'<span class="badge purple">호뇽단</span>':''}</div><div class="result-debts">${f.debts.length?f.debts.map(d=>`${esc(d.type)} ×${Number(d.count)}`).join(' · '):'현재 업보 없음'}</div></article>`).join('')}</div>`:'';
  const reportHtml=reports.length?`<h3 class="search-group-title">방송 기록</h3><div class="archive-list">${reports.slice(0,12).map(r=>`<article class="archive-list-card search-report" data-report-id="${esc(r.reportId)}"><span>${esc(r.date)} · ${archiveDuration(r.durationMinutes)}</span><b>${esc(r.title)}</b><small>${esc(r.memo||'방송 메모 없음')}</small></article>`).join('')}</div>`:'';
  $('searchResults').innerHTML=fanHtml+reportHtml||'<div class="empty">검색 결과가 없어요.</div>';
  document.querySelectorAll('.result-card').forEach(el=>el.onclick=()=>openProfile(el.dataset.id));
  document.querySelectorAll('.search-report').forEach(el=>el.onclick=()=>{selectArchiveReport(el.dataset.reportId);location.hash='archive'});
}
function renderNotices(){
  $('noticeCount').textContent=data.notices.length;
  $('noticeList').innerHTML=data.notices.length?data.notices
    .slice()
    .sort((a,b)=>Number(b.pinned)-Number(a.pinned)||a.order-b.order)
    .map(n=>`<article class="notice-card${n.pinned?' pinned':''}"><div class="notice-tag">${esc(n.category)}</div><div><h3>${esc(n.title)}</h3><p>${esc(n.content)}</p></div></article>`)
    .join(''):'<div class="empty">등록된 공지가 없어요.</div>';
}
function renderGames(status='playing'){
  const query=$('gameSearch')?.value.trim().toLowerCase()||'';
  const sort=$('gameSort')?.value||'order';
  $('gameTotalCount').textContent=data.games.length;
  $('playingCount').textContent=data.games.filter(g=>g.status==='playing').length;
  $('plannedCount').textContent=data.games.filter(g=>g.status==='planned').length;
  $('doneCount').textContent=data.games.filter(g=>g.status==='done').length;

  let list=data.games
    .filter(g=>g.status===status)
    .filter(g=>!query||`${g.title} ${g.memo||''}`.toLowerCase().includes(query))
    .slice();

  list.sort((a,b)=>{
    if(sort==='name') return a.title.localeCompare(b.title,'ko');
    if(sort==='progress') return (b.progressPercent-a.progressPercent)||a.title.localeCompare(b.title,'ko');
    return a.order-b.order;
  });

  $('gameGrid').innerHTML=list.length?list.map(g=>{
    const percent=gameProgressPercent(g);
    const progressText=g.progress||(
      g.status==='done'?'완료':
      g.status==='playing'?(percent?`${percent}% 진행`:'진행 중'):'예정'
    );
    return `<article class="game-card">
      <div class="game-cover">
        ${g.image?`<img src="${esc(g.image)}" alt="${esc(g.title)} 썸네일" loading="lazy" onerror="this.remove()">`:esc(g.icon||gameIcon(g.title))}
        <span class="game-status-chip">${esc(gameStatusLabel(g.status))}</span>
      </div>
      <h3>${esc(g.title)}</h3>
      <div class="game-meta">${esc(g.memo||'')}</div>
      <div class="game-progress-wrap">
        <div class="game-progress-label"><span>${esc(progressText)}</span><b>${percent}%</b></div>
        <div class="game-progress-track"><div class="game-progress-bar" style="width:${percent}%"></div></div>
      </div>
    </article>`;
  }).join(''):'<div class="empty">조건에 맞는 게임이 없어요.</div>';
}
let includePastSchedule=false;
function nextUpcomingSchedule(){
  const today=dayStart().getTime();
  return data.schedule.filter(s=>s.timestamp>=today).sort((a,b)=>a.timestamp-b.timestamp)[0]||null;
}
function updateHeroSchedule(){
  const next=nextUpcomingSchedule();
  const title=$('heroScheduleTitle'),text=$('heroScheduleText');
  if(!title||!text)return;
  if(!next){
    title.textContent='예정된 방송이 없어요';
    text.textContent='스케줄이 등록되면 여기에 가장 가까운 일정이 표시돼요.';
    return;
  }
  const dateObj=new Date(next.timestamp);
  title.textContent=sameDay(dateObj,new Date())?'오늘 방송':`다음 일정 · ${next.date}`;
  text.textContent=`${next.time||'시간 미정'} · ${next.title}${next.memo?' — '+next.memo:''}`;
}
function renderSchedule(){
  const today=dayStart();
  const todayTs=today.getTime();
  const upcoming=data.schedule.filter(s=>s.timestamp>=todayTs);
  $('upcomingCount').textContent=upcoming.length;
  const list=(includePastSchedule?data.schedule:data.schedule.filter(s=>s.timestamp>=todayTs))
    .slice().sort((a,b)=>a.timestamp-b.timestamp);
  if(!list.length){
    $('scheduleList').innerHTML='<div class="empty">등록된 예정 일정이 없어요.</div>';
    updateHeroSchedule();
    return;
  }
  let currentGroup='';
  $('scheduleList').innerHTML=list.map(s=>{
    const group=weekLabel(s.timestamp);
    const dateObj=Number.isFinite(s.timestamp)&&s.timestamp!==Number.MAX_SAFE_INTEGER?new Date(s.timestamp):null;
    const isToday=sameDay(dateObj,new Date());
    const isPast=dateObj&&s.timestamp<todayTs;
    const label=group!==currentGroup?`<div class="schedule-week-label">${esc(group)}</div>`:'';
    currentGroup=group;
    return `${label}<article class="schedule-card${isToday?' today':''}${isPast?' past':''}">
      <div class="schedule-date">${esc(s.date)}</div>
      <div class="schedule-time">${esc(s.time||'시간 미정')}</div>
      <div><b>${esc(s.title)}</b><p>${esc(s.memo)}</p>${s.type?`<span class="schedule-type">${esc(s.type)}</span>`:''}</div>
    </article>`;
  }).join('');
  updateHeroSchedule();
}

let debtListMode = false;
function debtTypeOptions(){
  const types=[...new Set(data.debts.map(d=>d.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  const select=$('debtTypeFilter'); if(!select)return;
  const selected=select.value;
  select.innerHTML='<option value="">모든 업보 종류</option>'+types.map(type=>`<option value="${esc(type)}">${esc(type)}</option>`).join('');
  if(types.includes(selected))select.value=selected;
}
function applyDebtViewMode(){
  const grid=$('debtGrid'),button=$('debtViewToggle'); if(!grid||!button)return;
  grid.classList.toggle('list-view',debtListMode); button.textContent=debtListMode?'카드 보기':'목록 보기';
}

function calculateDebtStats(){
  const fanMap=new Map(),typeMap=new Map();
  data.debts.forEach(debt=>{
    const count=Number(debt.count)||0;if(count<=0)return;
    const key=debt.key||debt.id||`nick:${debt.nickname}`;
    const fan=fanByKey(key);
    const nickname=fan?.nickname||debt.nickname||debt.id||'이름 없음';
    const fanKey=fan?.key||key||`nick:${nickname}`;
    if(!fanMap.has(fanKey))fanMap.set(fanKey,{nickname,count:0});
    fanMap.get(fanKey).count+=count;
    typeMap.set(debt.type,(typeMap.get(debt.type)||0)+count);
  });
  return{
    total:data.debts.reduce((sum,d)=>sum+(Number(d.count)||0),0),
    fans:[...fanMap.values()].sort((a,b)=>b.count-a.count||a.nickname.localeCompare(b.nickname,'ko')),
    types:[...typeMap.entries()].map(([type,count])=>({type,count})).sort((a,b)=>b.count-a.count||a.type.localeCompare(b.type,'ko'))
  };
}
function rankingHtml(rows,labelKey,limit){
  const list=rows.slice(0,limit);
  if(!list.length)return '<div class="stats-empty">아직 통계로 보여줄 업보가 없어요.</div>';
  const max=Math.max(...list.map(row=>Number(row.count)||0),1);
  return list.map((row,index)=>{
    const label=row[labelKey]||'-';
    const percent=Math.max(3,Math.round((Number(row.count)||0)/max*100));
    return `<div class="ranking-row"><span class="ranking-number">${index+1}</span><div class="ranking-main"><div class="ranking-label"><span>${esc(label)}</span><span>${Number(row.count)||0}개</span></div><div class="ranking-track"><div class="ranking-bar" style="width:${percent}%"></div></div></div><span class="ranking-value">${Number(row.count)||0}</span></div>`;
  }).join('');
}
function renderStats(){
  const stats=calculateDebtStats(),topType=stats.types[0];
  $('statsTotalDebt').textContent=stats.total;
  $('statsFanCount').textContent=stats.fans.length;
  $('statsTypeCount').textContent=stats.types.length;
  $('statsTopType').textContent=topType?.type||'-';
  $('statsTopTypeCount').textContent=topType?`현재 ${topType.count}개`:'아직 데이터가 없어요';
  $('fanRanking').innerHTML=rankingHtml(stats.fans,'nickname',Number($('fanRankingLimit')?.value||5));
  $('typeRanking').innerHTML=rankingHtml(stats.types,'type',Number($('typeRankingLimit')?.value||5));
}


let archiveViewDate=new Date();archiveViewDate.setDate(1);let selectedArchiveReportId='';
function archiveDuration(minutes){const n=Math.max(0,Number(minutes)||0),h=Math.floor(n/60),m=n%60;return h?`${h}시간 ${m}분`:`${m}분`}
function reportsForDate(date){return(data.reports||[]).filter(r=>r.date===date)}
function archiveRankHtml(rows,limit){const list=(rows||[]).slice(0,limit);return list.length?list.map((r,i)=>`<div class="archive-rank"><span>${i+1}. ${esc(r.name||'-')}</span><span>${Number(r.count)||0}개</span></div>`).join(''):'<div class="tiny">기록 없음</div>'}
function renderArchiveCalendar(){const y=archiveViewDate.getFullYear(),m=archiveViewDate.getMonth();$('archiveMonthLabel').textContent=`${y}년 ${m+1}월`;const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),today=new Date(),cells=[];for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,rs=reportsForDate(key),classes=['archive-day'];if(d.getMonth()!==m)classes.push('other-month');if(d.toDateString()===today.toDateString())classes.push('today');if(rs.length)classes.push('has-report');if(rs.some(r=>r.reportId===selectedArchiveReportId))classes.push('selected');cells.push(`<button type="button" class="${classes.join(' ')}" data-archive-date="${key}" ${rs.length?'':'disabled'}><span class="archive-day-number">${d.getDate()}</span>${rs.length?`<span class="archive-day-dot"></span><span class="archive-day-count">${rs.length}회</span>`:''}</button>`)}$('archiveCalendar').innerHTML=cells.join('');document.querySelectorAll('[data-archive-date]:not(:disabled)').forEach(b=>b.onclick=()=>{const rs=reportsForDate(b.dataset.archiveDate);if(rs.length)selectArchiveReport(rs[0].reportId)})}
function selectArchiveReport(id){const r=(data.reports||[]).find(x=>x.reportId===id);if(!r)return;selectedArchiveReportId=id;$('archiveDetailEmpty').hidden=true;$('archiveDetail').hidden=false;$('archiveDetailDate').textContent=r.date;$('archiveDetailTitle').textContent=r.title||'방송';$('archiveDetailDuration').textContent=archiveDuration(r.durationMinutes);$('archiveAdded').textContent=r.added||0;$('archiveCompleted').textContent=r.completed||0;$('archiveNewFans').textContent=r.newFans||0;$('archiveNewHonyo').textContent=r.newHonyo||0;$('archiveTopFans').innerHTML=archiveRankHtml(r.topFans,3);$('archiveTopTypes').innerHTML=archiveRankHtml(r.topTypes,5);$('archiveMemoWrap').hidden=!r.memo;$('archiveMemo').textContent=r.memo||'';const clips=(data.clips||[]).filter(c=>c.reportId===r.reportId);$('archiveClipsWrap').hidden=!clips.length;$('archiveClips').innerHTML=clips.map(c=>`<div class="archive-clip"><b>${esc(c.timecode)}</b><span>${esc(c.category)}</span><span>${esc(c.memo)}</span></div>`).join('');const [y,m]=r.date.split('-').map(Number);archiveViewDate=new Date(y,m-1,1);renderArchiveCalendar()}
function renderArchiveList(){const years=[...new Set((data.reports||[]).map(r=>r.date.slice(0,4)))].filter(Boolean).sort().reverse(),sel=$('archiveYearFilter'),cur=sel.value;sel.innerHTML='<option value="">전체 연도</option>'+years.map(y=>`<option value="${y}">${y}년</option>`).join('');if(years.includes(cur))sel.value=cur;const rows=(data.reports||[]).filter(r=>!sel.value||r.date.startsWith(sel.value));$('archiveCount').textContent=(data.reports||[]).length;$('archiveList').innerHTML=rows.length?rows.map(r=>`<article class="archive-list-card" data-report-id="${esc(r.reportId)}"><span>${esc(r.date)} · ${archiveDuration(r.durationMinutes)}</span><b>${esc(r.title||'방송')}</b><small>${esc(r.startedAt||'')} ~ ${esc(r.endedAt||'')}</small><div class="archive-list-stats"><i>업보 +${r.added||0}</i><i>완료 ${r.completed||0}</i><i>팬 +${r.newFans||0}</i></div></article>`).join(''):'<div class="empty">저장된 방송 기록이 없어요.</div>';document.querySelectorAll('[data-report-id]').forEach(c=>c.onclick=()=>selectArchiveReport(c.dataset.reportId))}
function renderArchive(){renderArchiveCalendar();renderArchiveList();if(!selectedArchiveReportId&&(data.reports||[]).length)selectArchiveReport(data.reports[0].reportId)}


let activeSeason='all';

function reportSeasonKey(report){
  const [year,month]=String(report.date||'').split('-').map(Number);
  if(!year||!month)return '';
  return `${year}-${month<=6?'H1':'H2'}`;
}
function seasonLabel(key){
  if(key==='all')return '전체 기간';
  const match=String(key).match(/^(\d{4})-(H1|H2)$/);
  return match?`${match[1]}년 ${match[2]==='H1'?'상반기':'하반기'}`:key;
}
function seasonReports(){
  return (data.reports||[]).filter(report=>activeSeason==='all'||reportSeasonKey(report)===activeSeason);
}
function populateSeasonOptions(){
  const keys=[...new Set((data.reports||[]).map(reportSeasonKey).filter(Boolean))].sort().reverse();
  const select=$('seasonFilter');
  const current=activeSeason;
  select.innerHTML='<option value="all">전체 기간</option>'+keys.map(key=>`<option value="${key}">${seasonLabel(key)}</option>`).join('');
  if(current==='all'||keys.includes(current))select.value=current;
}
function aggregateReportRows(reports,key){
  const map=new Map();
  reports.forEach(report=>{
    (report[key]||[]).forEach(row=>{
      const name=String(row.name||'').trim();
      if(name)map.set(name,(map.get(name)||0)+(Number(row.count)||0));
    });
  });
  return [...map.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'ko'));
}
function fanHistory(nickname,reports=data.reports||[]){
  let totalAdded=0,appearances=0,firstDate='',lastDate='';
  const types=new Map();
  reports.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(report=>{
    const fanRow=(report.topFans||[]).find(row=>String(row.name).trim()===nickname);
    if(fanRow){
      const count=Number(fanRow.count)||0;
      totalAdded+=count;appearances++;
      if(!firstDate)firstDate=report.date;
      lastDate=report.date;
    }
    (report.topTypes||[]).forEach(row=>{
      if(fanRow)types.set(row.name,(types.get(row.name)||0)+Math.min(Number(row.count)||0,Number(fanRow.count)||0));
    });
  });
  return{totalAdded,appearances,firstDate,lastDate,types:[...types.entries()].sort((a,b)=>b[1]-a[1])};
}
function seasonFanHistory(nickname){return fanHistory(nickname,seasonReports())}
function badgeData(){
  const reports=data.reports||[];
  const fanRows=aggregateReportRows(reports,'topFans');
  const typeRows=aggregateReportRows(reports,'topTypes');
  const topFan=fanRows[0]?.name||'';
  const typeKings=new Map();

  typeRows.slice(0,8).forEach(typeRow=>{
    let bestName='',bestValue=0;
    reports.forEach(report=>{
      const typeCount=(report.topTypes||[]).find(row=>row.name===typeRow.name)?.count||0;
      if(!typeCount)return;
      (report.topFans||[]).forEach(fan=>{
        const estimate=Math.min(Number(fan.count)||0,Number(typeCount)||0);
        if(estimate>bestValue){bestValue=estimate;bestName=fan.name}
      });
    });
    if(bestName)typeKings.set(typeRow.name,{name:bestName,count:bestValue});
  });
  return{topFan,typeKings};
}
function badgesForFan(fan){
  const history=fanHistory(fan.nickname),badges=[],hall=badgeData();
  if(hall.topFan===fan.nickname)badges.push({text:'👑 업보왕',kind:''});
  if(fan.honyo||data.honyodan.some(h=>h.nickname===fan.nickname))badges.push({text:'💜 호뇽단',kind:'purple'});
  if((fan.total||0)>=10)badges.push({text:'⭐ VIP',kind:'pink'});
  if(history.appearances>=3)badges.push({text:'🔥 단골팬',kind:'pink'});
  for(const [type,king] of hall.typeKings){
    if(king.name===fan.nickname){badges.push({text:`🏅 ${type}왕`,kind:''});break}
  }
  return badges;
}
function fanBadgesHtml(fan){
  return badgesForFan(fan).map(b=>`<span class="fan-achievement ${b.kind}">${esc(b.text)}</span>`).join('');
}
function seasonRankHtml(rows,limit=10){
  const list=rows.slice(0,limit);
  return list.length?list.map((row,index)=>`<div class="season-rank-row"><span class="season-rank-no">${index+1}</span><span class="season-rank-name">${esc(row.name)}</span><span class="season-rank-value">${row.count}개</span></div>`).join(''):'<div class="stats-empty">기록이 없어요.</div>';
}
function renderMonthlyGrowth(reports){
  const months=new Map();
  reports.forEach(r=>{
    const key=String(r.date||'').slice(0,7);
    if(!key)return;
    const item=months.get(key)||{month:key,added:0,broadcasts:0};
    item.added+=Number(r.added)||0;item.broadcasts++;months.set(key,item);
  });
  const rows=[...months.values()].sort((a,b)=>a.month.localeCompare(b.month));
  if(!rows.length){$('monthlyGrowthChart').innerHTML='<div class="stats-empty">월별 기록이 없어요.</div>';return}
  const max=Math.max(...rows.map(r=>r.added),1);
  $('monthlyGrowthChart').innerHTML=rows.map(r=>`<div class="monthly-bar-row"><span class="monthly-bar-label">${esc(r.month)}</span><div class="monthly-bar-track"><div class="monthly-bar-fill" style="width:${Math.max(3,Math.round(r.added/max*100))}%"></div></div><span class="monthly-bar-value">+${r.added} · ${r.broadcasts}회</span></div>`).join('');
}
function renderHallOfFame(fans,types,reports){
  const longest=[...reports].sort((a,b)=>(b.durationMinutes||0)-(a.durationMinutes||0))[0];
  const biggest=[...reports].sort((a,b)=>(b.added||0)-(a.added||0))[0];
  const cards=[
    ['👑 업보왕',fans[0]?.name||'-',fans[0]?`${fans[0].count}개`:'기록 없음'],
    ['🎲 인기 업보',types[0]?.name||'-',types[0]?`${types[0].count}개`:'기록 없음'],
    ['⏱️ 최장 방송',longest?.title||'-',longest?archiveDuration(longest.durationMinutes):'기록 없음'],
    ['🔥 최다 룰렛 방송',biggest?.title||'-',biggest?`+${biggest.added}개`:'기록 없음']
  ];
  $('hallOfFame').innerHTML=cards.map(c=>`<div class="hall-card"><span>${esc(c[0])}</span><b>${esc(c[1])}</b><small>${esc(c[2])}</small></div>`).join('');
}
function renderSeasonAnalytics(){
  populateSeasonOptions();
  const reports=seasonReports();
  const fans=aggregateReportRows(reports,'topFans');
  const types=aggregateReportRows(reports,'topTypes');
  const minutes=reports.reduce((s,r)=>s+(Number(r.durationMinutes)||0),0);
  $('seasonBroadcasts').textContent=reports.length;
  $('seasonHours').textContent=minutes>=60?`${Math.floor(minutes/60)}시간 ${minutes%60}분`:`${minutes}분`;
  $('seasonAdded').textContent=reports.reduce((s,r)=>s+(Number(r.added)||0),0);
  $('seasonCompleted').textContent=reports.reduce((s,r)=>s+(Number(r.completed)||0),0);
  $('seasonNewFans').textContent=reports.reduce((s,r)=>s+(Number(r.newFans)||0),0);
  $('seasonNewHonyo').textContent=reports.reduce((s,r)=>s+(Number(r.newHonyo)||0),0);
  $('seasonFanRanking').innerHTML=seasonRankHtml(fans);
  $('seasonTypeRanking').innerHTML=seasonRankHtml(types);
  renderMonthlyGrowth(reports);
  renderHallOfFame(fans,types,reports);
}


function renderQuickStatus(){
  const grouped=groupedFans();
  const totalDebts=data.debts.reduce((sum,row)=>sum+(Number(row.count)||0),0);
  const debtCount=$('quickDebtCount');
  const fanCount=$('quickFanCount');
  const honyoCount=$('quickHonyoCount');
  const latestBroadcast=$('quickLatestBroadcast');
  if(debtCount)debtCount.textContent=totalDebts;
  if(fanCount)fanCount.textContent=grouped.filter(f=>f.total>0).length;
  if(honyoCount)honyoCount.textContent=data.honyodan.length;
  if(latestBroadcast)latestBroadcast.textContent=data.reports?.[0]?.date||'-';
}

function renderAll(){
  debtTypeOptions(); renderDebts(); renderHonyo(); renderNotices();
  renderGames(document.querySelector('.tab.active')?.dataset.status||'playing'); renderSchedule(); renderStats(); renderArchive(); renderSeasonAnalytics(); renderQuickStatus();
}

$('debtSearch').oninput=renderDebts;
$('debtSort').onchange=renderDebts;
$('honyoSearch').oninput=renderHonyo;
$('globalSearchButton').onclick=globalSearch;
$('globalSearch').onkeydown=e=>{if(e.key==='Enter')globalSearch()};
$('upcomingOnly').onclick=()=>{
  includePastSchedule=false;
  $('upcomingOnly').classList.add('active');
  $('showAllSchedule').classList.remove('active');
  renderSchedule();
};
$('showAllSchedule').onclick=()=>{
  includePastSchedule=true;
  $('showAllSchedule').classList.add('active');
  $('upcomingOnly').classList.remove('active');
  renderSchedule();
};
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderGames(b.dataset.status)});
$('gameSearch').oninput=()=>renderGames(document.querySelector('.tab.active')?.dataset.status||'playing');
$('gameSort').onchange=()=>renderGames(document.querySelector('.tab.active')?.dataset.status||'playing');
$('fanRankingLimit').onchange=renderStats;
$('typeRankingLimit').onchange=renderStats;
$('archivePrevMonth').onclick=()=>{archiveViewDate.setMonth(archiveViewDate.getMonth()-1);renderArchiveCalendar()};
$('archiveNextMonth').onclick=()=>{archiveViewDate.setMonth(archiveViewDate.getMonth()+1);renderArchiveCalendar()};
$('archiveToday').onclick=()=>{archiveViewDate=new Date();archiveViewDate.setDate(1);renderArchiveCalendar()};
$('archiveYearFilter').onchange=renderArchiveList;
$('seasonFilter').onchange=()=>{activeSeason=$('seasonFilter').value;renderSeasonAnalytics()};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
document.querySelectorAll('dialog').forEach(d=>d.onclick=e=>{if(e.target===d)d.close()});
$('menuButton').onclick=()=>$('mainNav').classList.toggle('open');
document.querySelectorAll('#mainNav a').forEach(a=>a.onclick=()=>$('mainNav').classList.remove('open'));

renderAll();
loadGoogleSheets();


function setupOperations(){
  const config = window.BROADCAST_PAGE_CONFIG || {};
  const refresh = $('refreshData');
  if (refresh) refresh.onclick = async () => {
    refresh.disabled = true; refresh.textContent = '불러오는 중…';
    await loadGoogleSheets();
    showToast('데이터를 새로 불러왔어요.');
    refresh.disabled = false; refresh.textContent = '새로고침';
  };
  const minutes = Number(config.autoRefreshMinutes || 0);
  if (minutes > 0) setInterval(loadGoogleSheets, minutes * 60 * 1000);
}
setupOperations();

window.addEventListener('DOMContentLoaded',()=>{
  $('debtTypeFilter')?.addEventListener('change',renderDebts);
  $('debtViewToggle')?.addEventListener('click',()=>{debtListMode=!debtListMode;applyDebtViewMode();});
});

function openFanFromUrl(){
  const name=new URLSearchParams(location.search).get('fan'); if(!name)return;
  const match=groupedFans().find(f=>f.nickname===name||f.id===name);
  if(match){$('globalSearch').value=name;globalSearch();setTimeout(()=>openProfile(match.key||match.id),250);}
}
const originalLoadGoogleSheets=loadGoogleSheets;
loadGoogleSheets=async function(){await originalLoadGoogleSheets();openFanFromUrl();};


// Stage 10: UI 운영 도구
let toastTimer;
function showToast(message){
  const toast=$('toast');
  if(!toast)return;
  clearTimeout(toastTimer);
  toast.textContent=message;
  toast.hidden=false;
  requestAnimationFrame(()=>toast.classList.add('show'));
  toastTimer=setTimeout(()=>{
    toast.classList.remove('show');
    setTimeout(()=>toast.hidden=true,220);
  },2200);
}

function applyTheme(theme){
  const dark=theme==='dark';
  document.body.classList.toggle('dark',dark);
  const button=$('themeToggle');
  if(button){
    button.textContent=dark?'☀️':'🌙';
    button.setAttribute('aria-label',dark?'라이트모드 전환':'다크모드 전환');
    button.title=dark?'라이트모드 전환':'다크모드 전환';
  }
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=dark?'#17131f':'#f58ab4';
}

function setupTheme(){
  const saved=localStorage.getItem('honyong-theme');
  const preferred=window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light';
  applyTheme(saved||preferred);
  $('themeToggle')?.addEventListener('click',()=>{
    const next=document.body.classList.contains('dark')?'light':'dark';
    localStorage.setItem('honyong-theme',next);
    applyTheme(next);
    showToast(next==='dark'?'다크모드로 바꿨어요.':'라이트모드로 바꿨어요.');
  });
}

async function shareCurrentSite(){
  const shareData={
    title:document.title,
    text:'한설 방송용 페이지',
    url:location.href
  };
  try{
    if(navigator.share){
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(location.href);
    showToast('사이트 주소를 복사했어요.');
  }catch(error){
    if(error?.name!=='AbortError'){
      try{
        await navigator.clipboard.writeText(location.href);
        showToast('사이트 주소를 복사했어요.');
      }catch{
        showToast('주소 복사에 실패했어요.');
      }
    }
  }
}

function updateNetworkState(){
  const banner=$('networkBanner');
  if(!banner)return;
  banner.hidden=navigator.onLine;
  if(navigator.onLine){
    showToast('인터넷에 다시 연결됐어요.');
  }
}

function setupBackToTop(){
  const button=$('backToTop');
  if(!button)return;
  const update=()=>button.classList.toggle('visible',window.scrollY>520);
  window.addEventListener('scroll',update,{passive:true});
  button.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  update();
}

function setupKeyboardShortcuts(){
  document.addEventListener('keydown',event=>{
    const tag=document.activeElement?.tagName?.toLowerCase();
    const typing=['input','textarea','select'].includes(tag);
    if(event.key==='/'&&!typing){
      event.preventDefault();
      $('globalSearch')?.focus();
      showToast('검색창으로 이동했어요.');
    }
    if(event.key==='Escape'){
      document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
      $('mainNav')?.classList.remove('open');
    }
  });
}

function setupStage10(){
  setupTheme();
  setupBackToTop();
  setupKeyboardShortcuts();
  $('shareSite')?.addEventListener('click',shareCurrentSite);
  window.addEventListener('online',updateNetworkState);
  window.addEventListener('offline',updateNetworkState);
  updateNetworkState();
}
setupStage10();


// Stage 20-1: Pink & White theme only
try{
  localStorage.setItem('honyong-theme','light');
  document.body.classList.remove('dark');
}catch{}

try{renderSetupWarning()}catch(error){console.warn(error)}
