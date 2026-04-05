// NEXA v1.0 — Beyond Fintech | Data & State Layer
'use strict';
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const rand=(a,b)=>Math.random()*(b-a)+a,randInt=(a,b)=>Math.floor(rand(a,b+1)),pick=a=>a[randInt(0,a.length-1)];
const fmt=n=>n.toLocaleString('en-US',{maximumFractionDigits:0});
const fmtM=n=>n>=1e9?'$'+(n/1e9).toFixed(2)+'B':n>=1e6?'$'+(n/1e6).toFixed(2)+'M':'$'+fmt(n);
const fmtP=n=>(n>=0?'+':'')+n.toFixed(2)+'%';
const utc=()=>new Date().toISOString().slice(11,19)+' UTC';
const uid=()=>'NX-'+Date.now().toString(36).toUpperCase()+randInt(100,999);
const ago=m=>m<60?m+'m ago':Math.floor(m/60)+'h ago';

// ═══════ AUTH & USER ═══════
const DEMO_USERS=[
  {id:'U001',name:'Alexander Hartwell',email:'alex@nexa.com',pass:'nexa123',role:'super_admin',avatar:'AH',phone:'+1 (212) 555-0147',joined:'2024-03-15',status:'active',kyc:'verified'},
  {id:'U002',name:'Sofia Chen',email:'sofia@nexa.com',pass:'nexa123',role:'user',avatar:'SC',phone:'+1 (415) 555-0298',joined:'2024-06-22',status:'active',kyc:'verified'},
  {id:'U003',name:'Marcus Webb',email:'marcus@nexa.com',pass:'nexa123',role:'compliance_admin',avatar:'MW',phone:'+44 20 7946 0958',joined:'2024-08-10',status:'active',kyc:'verified'},
  {id:'U004',name:'Priya Sharma',email:'priya@nexa.com',pass:'nexa123',role:'analytics_admin',avatar:'PS',phone:'+91 98765 43210',joined:'2024-09-05',status:'active',kyc:'pending'},
  {id:'U005',name:'James Foster',email:'james@nexa.com',pass:'nexa123',role:'support_admin',avatar:'JF',phone:'+1 (312) 555-0463',joined:'2025-01-18',status:'suspended',kyc:'verified'},
];
const ROLES={
  super_admin:{label:'Super Admin',pages:['dashboard','markets','portfolio','globe','accounts','transfers','transactions','profile','support','security','settings','admin_dash','admin_users','admin_tx','admin_risk','admin_compliance','admin_analytics','admin_support','admin_settings']},
  compliance_admin:{label:'Compliance Admin',pages:['dashboard','markets','portfolio','accounts','transfers','transactions','profile','support','security','settings','admin_compliance','admin_risk']},
  support_admin:{label:'Support Admin',pages:['dashboard','markets','portfolio','accounts','transfers','transactions','profile','support','security','settings','admin_support','admin_users']},
  analytics_admin:{label:'Analytics Admin',pages:['dashboard','markets','portfolio','accounts','transfers','transactions','profile','support','security','settings','admin_analytics','admin_dash']},
  user:{label:'User',pages:['dashboard','markets','portfolio','globe','accounts','transfers','transactions','profile','support','security','settings']},
};

// ═══════ MARKET DATA ═══════
const STOCKS=[
  {sym:'AAPL',name:'Apple Inc.',price:189.50,sector:'Tech'},{sym:'GOOGL',name:'Alphabet',price:176.20,sector:'Tech'},
  {sym:'MSFT',name:'Microsoft',price:425.80,sector:'Tech'},{sym:'AMZN',name:'Amazon',price:186.40,sector:'Consumer'},
  {sym:'NVDA',name:'NVIDIA',price:875.30,sector:'Tech'},{sym:'META',name:'Meta',price:502.10,sector:'Tech'},
  {sym:'TSLA',name:'Tesla',price:175.60,sector:'Auto'},{sym:'JPM',name:'JPMorgan',price:198.70,sector:'Finance'},
  {sym:'V',name:'Visa',price:280.90,sector:'Finance'},{sym:'BRK.B',name:'Berkshire',price:412.60,sector:'Finance'}
];
STOCKS.forEach(s=>{s.change=rand(-5,8);s.changePct=s.change/s.price*100;s.hist=[];s.ohlc=[];
  let p=s.price;for(let i=0;i<60;i++){p+=rand(-3,3);s.hist.push(p);
    const o=p+rand(-2,2),c=o+rand(-4,4),h=Math.max(o,c)+rand(0,3),l=Math.min(o,c)-rand(0,3);
    s.ohlc.push({o,h,l,c,v:randInt(1e6,5e7)})}s.vol=randInt(1e6,5e7)});

const INDICES=[
  {n:'S&P 500',v:4892.50,c:rand(.3,1.5)},{n:'NASDAQ',v:16742.80,c:rand(.5,2)},
  {n:'DOW',v:39128.40,c:rand(.2,1)},{n:'NIFTY 50',v:22456.80,c:rand(-.5,1.8)},
  {n:'SENSEX',v:73876.50,c:rand(-.3,1.5)}
];

// ═══════ CURRENCY EXCHANGE ═══════
const CURRENCIES=[
  {from:'USD',to:'INR',rate:83.42,change:rand(-.5,.5),hist:Array.from({length:30},()=>83+rand(-1,1))},
  {from:'USD',to:'EUR',rate:0.92,change:rand(-.02,.02),hist:Array.from({length:30},()=>.92+rand(-.02,.02))},
  {from:'USD',to:'GBP',rate:0.79,change:rand(-.02,.02),hist:Array.from({length:30},()=>.79+rand(-.02,.02))},
  {from:'USD',to:'JPY',rate:149.50,change:rand(-.8,.8),hist:Array.from({length:30},()=>149.5+rand(-1.5,1.5))},
];

// ═══════ ECONOMIC INDICATORS ═══════
const INFLATION={current:6.2,prev:5.8,trend:'rising',monthly:[5.1,5.4,5.6,5.8,5.9,6.0,5.8,5.9,6.0,6.1,6.0,6.2]};
const GDP_GROWTH={current:3.1,prev:2.8,trend:'stable'};
const INTEREST_RATE={current:5.25,prev:5.50,trend:'decreasing'};

// ═══════ TRANSACTIONS ═══════
const TX_CATS=['Transfer','Payment','Investment','Subscription','Salary','Refund','Withdrawal','Deposit'];
const TX_MERCHANTS=['Amazon','Netflix','Spotify','Apple','Google Cloud','Uber','Starbucks','Whole Foods','Rent','Salary Credit','Dividend','ETF Purchase'];
function genTx(n){const txs=[];for(let i=0;i<n;i++){const isCredit=Math.random()>.55;
  txs.push({id:uid(),type:isCredit?'credit':'debit',cat:pick(TX_CATS),merchant:pick(TX_MERCHANTS),
    amt:isCredit?rand(500,25000):rand(10,5000),date:new Date(Date.now()-randInt(0,30)*864e5).toISOString().slice(0,10),
    time:utc(),status:Math.random()>.92?'flagged':Math.random()>.05?'completed':'pending',
    riskScore:randInt(0,100),note:''})}return txs.sort((a,b)=>b.date.localeCompare(a.date))}

// ═══════ SMART INSIGHTS (Invisible Intelligence) ═══════
const INSIGHTS=[
  {icon:'shield-check',type:'security',title:'Account Protected',body:'All security checks passed. Your account shows no unusual activity.',priority:'low',time:2},
  {icon:'trending-up',type:'insight',title:'Spending Pattern Detected',body:'Your dining expenses are 23% higher than last month. Consider setting a budget alert.',priority:'medium',time:8},
  {icon:'zap',type:'recommendation',title:'Savings Opportunity',body:'Based on your cash flow, you could increase monthly savings by $420 without lifestyle impact.',priority:'medium',time:15},
  {icon:'alert-triangle',type:'alert',title:'Unusual Transaction',body:'A $2,847 transaction to a new merchant was flagged for review. Tap to verify.',priority:'high',time:3},
  {icon:'pie-chart',type:'insight',title:'Portfolio Rebalance Due',body:'Your equity allocation has drifted 6% from target. Consider rebalancing this quarter.',priority:'medium',time:45},
  {icon:'dollar-sign',type:'recommendation',title:'Rate Comparison',body:'Your savings rate is 1.2% below market average. Consider our Premium Savings tier at 4.85% APY.',priority:'low',time:120},
  {icon:'activity',type:'insight',title:'Income Growth Detected',body:'Your income has grown 8.4% year-over-year. Financial health score updated.',priority:'low',time:180},
  {icon:'shield',type:'security',title:'Login from New Device',body:'Windows device in New York. If this wasn\'t you, please secure your account immediately.',priority:'high',time:5},
];

// ═══════ SUPPORT TICKETS ═══════
const SUPPORT_TICKETS=[
  {id:'TK-001',subject:'Unable to link external account',status:'open',priority:'high',created:'2026-04-01',messages:2},
  {id:'TK-002',subject:'Transaction dispute — double charge',status:'in_progress',priority:'medium',created:'2026-03-28',messages:4},
  {id:'TK-003',subject:'KYC document re-upload',status:'resolved',priority:'low',created:'2026-03-20',messages:3},
];

// ═══════ COMPLIANCE & KYC ═══════
const KYC_QUEUE=[
  {userId:'U004',name:'Priya Sharma',docType:'Passport',submitted:'2026-04-02',status:'pending',riskLevel:'low'},
  {userId:'U006',name:'David Kim',docType:'Driver License',submitted:'2026-04-01',status:'pending',riskLevel:'medium'},
  {userId:'U007',name:'Elena Volkov',docType:'National ID',submitted:'2026-03-30',status:'pending',riskLevel:'high'},
];

// ═══════ ADMIN ANALYTICS ═══════
const ADMIN_METRICS={
  totalUsers:24867,activeToday:3421,newThisMonth:892,
  totalTxVolume:rand(5e8,2e9),avgTxSize:rand(200,1500),
  flaggedTx:randInt(12,45),resolvedToday:randInt(5,20),
  revenue:{monthly:[420000,445000,468000,492000,510000,538000,562000,585000,612000,640000,668000,698000]},
  retention:{m1:92,m3:78,m6:65,m12:52},
  riskDistribution:{low:72,medium:22,high:6},
};

// ═══════ SECTORS ═══════
const SECTORS=[
  {n:'Technology',c:rand(-2,5),w:22},{n:'Finance',c:rand(-1,3),w:18},{n:'Healthcare',c:rand(-3,4),w:14},
  {n:'Energy',c:rand(-4,3),w:12},{n:'Consumer',c:rand(-2,2),w:10},{n:'Industrial',c:rand(-1,3),w:8},
  {n:'Real Estate',c:rand(-2,2),w:6},{n:'Utilities',c:rand(-.5,1),w:5},{n:'Telecom',c:rand(-1,2),w:5},
];

// ═══════ GLOBAL STATE ═══════
const S={
  // Auth
  loggedIn:false,currentUser:null,isAdmin:false,
  // Navigation
  currentPage:'dashboard',guideOpen:false,selectedStock:0,
  // Financial
  totalBal:rand(5e6,15e6),monthGrowth:rand(1,5),portfolioReturn:rand(8,18),
  healthScore:87,sentiment:'bullish',
  // Accounts
  accounts:[
    {id:'ACC-001',type:'Checking',name:'Primary Checking',bal:rand(5e4,5e5),rate:'0.05%',status:'active'},
    {id:'ACC-002',type:'Savings',name:'Premium Savings',bal:rand(1e5,2e6),rate:'4.85%',status:'active'},
    {id:'ACC-003',type:'Investment',name:'Growth Portfolio',bal:rand(5e5,5e6),rate:'7.80%',status:'active'},
    {id:'ACC-004',type:'Fixed Deposit',name:'12-Month FD',bal:rand(2e5,3e6),rate:'5.10%',status:'active'}
  ],
  holdings:[
    {n:'US Treasury Bonds',t:'USTB',v:rand(1e6,5e6),c:rand(-2,5),alloc:28,color:'#60a5fa'},
    {n:'S&P 500 ETF',t:'SPY',v:rand(5e5,3e6),c:rand(-3,8),alloc:25,color:'#34d399'},
    {n:'Gold Futures',t:'GC',v:rand(2e5,1e6),c:rand(-1,4),alloc:12,color:'#D4AF37'},
    {n:'Tech Growth Fund',t:'QQQ',v:rand(4e5,2e6),c:rand(-5,12),alloc:22,color:'#a78bfa'},
    {n:'Emerging Markets',t:'EEM',v:rand(2e5,8e5),c:rand(-4,6),alloc:13,color:'#22d3ee'}
  ],
  wallets:[{cur:'USD',bal:rand(1e6,1e8),rate:1},{cur:'EUR',bal:rand(5e5,5e7),rate:0.92},{cur:'GBP',bal:rand(3e5,3e7),rate:0.79},{cur:'JPY',bal:rand(1e8,5e9),rate:149.5},{cur:'CHF',bal:rand(2e5,2e7),rate:0.88},{cur:'SGD',bal:rand(4e5,4e7),rate:1.34}],
  perfH:Array.from({length:30},(_,i)=>({v:92+i*1.2+rand(-5,5)})),
  portH:Array.from({length:30},(_,i)=>({v:100+i*1.5+rand(-8,8)})),
  spending:[{cat:'Housing',pct:32,color:'#60a5fa'},{cat:'Food',pct:18,color:'#34d399'},{cat:'Transport',pct:12,color:'#a78bfa'},{cat:'Entertainment',pct:8,color:'#D4AF37'},{cat:'Savings',pct:22,color:'#22d3ee'},{cat:'Other',pct:8,color:'#fb7185'}],
  transactions:genTx(50),
  // v9 features
  theme:'dark',chartMode:'line',riskGaugeValue:32,
  // Admin
  auditLog:[],adminView:'admin_dash',
  // Notifications
  notifCount:3,
};

// ═══════ NOTIFICATIONS ═══════
const NOTIFS=[
  {pri:'high',title:'Security check passed',body:'Biometric verification completed successfully.',time:'2m ago',icon:'shield-check'},
  {pri:'medium',title:'Dividend received',body:'$1,240 from AAPL credited to your investment account.',time:'15m ago',icon:'dollar-sign'},
  {pri:'low',title:'Weekly summary ready',body:'Your financial overview for this week is available.',time:'1h ago',icon:'file-text'},
  {pri:'high',title:'Milestone reached',body:'Emergency Fund is now 85% funded — ahead of schedule!',time:'2h ago',icon:'target'},
  {pri:'medium',title:'Rebalance suggestion',body:'Portfolio drift detected: Tech overweight by 4.2%.',time:'3h ago',icon:'pie-chart'},
  {pri:'low',title:'New feature available',body:'Strategy Planner is now live. Test market scenarios.',time:'5h ago',icon:'compass'},
  {pri:'medium',title:'Tax optimization found',body:'Harvesting losses on EEM could save ~$3,200 this year.',time:'6h ago',icon:'percent'},
];

// ═══════ COMMAND PALETTE ═══════
const CMD_ACTIONS=[
  {icon:'home',label:'Dashboard',tag:'page',action:'dashboard'},
  {icon:'trending-up',label:'Markets',tag:'page',action:'markets'},
  {icon:'briefcase',label:'Portfolio',tag:'page',action:'portfolio'},
  {icon:'globe',label:'Global Finance',tag:'page',action:'globe'},
  {icon:'credit-card',label:'Transactions',tag:'page',action:'transactions'},
  {icon:'user',label:'Profile',tag:'page',action:'profile'},
  {icon:'help-circle',label:'Support',tag:'page',action:'support'},
  {icon:'lock',label:'Security',tag:'page',action:'security'},
  {icon:'settings',label:'Settings',tag:'page',action:'settings'},
  {icon:'bell',label:'Open notifications',tag:'action',action:'notifs'},
  {icon:'moon',label:'Toggle theme',tag:'action',action:'toggle-theme'},
  {icon:'send',label:'Send money',tag:'action',action:'send-money'},
  {icon:'bar-chart-2',label:'View analytics',tag:'action',action:'analytics'},
];

// ═══════ GLOBE DATA ═══════
const CITIES=[
  {n:'New York',lat:40.7,lng:-74,vol:'High'},{n:'London',lat:51.5,lng:-0.1,vol:'High'},{n:'Singapore',lat:1.3,lng:103.8,vol:'High'},
  {n:'Tokyo',lat:35.7,lng:139.7,vol:'High'},{n:'Dubai',lat:25.2,lng:55.3,vol:'Medium'},{n:'Mumbai',lat:19.1,lng:72.9,vol:'Medium'},
  {n:'Hong Kong',lat:22.3,lng:114.2,vol:'High'},{n:'Sydney',lat:-33.9,lng:151.2,vol:'Medium'},{n:'Frankfurt',lat:50.1,lng:8.7,vol:'Medium'},
  {n:'Shanghai',lat:31.2,lng:121.5,vol:'High'},{n:'Toronto',lat:43.7,lng:-79.4,vol:'Medium'},{n:'Paris',lat:48.9,lng:2.3,vol:'Medium'},
];
const CONTINENTS=[
  [[60,-145],[65,-168],[72,-155],[72,-130],[70,-100],[62,-75],[55,-58],[48,-60],[45,-70],[38,-82],[30,-82],[25,-98],[30,-108],[35,-120],[42,-124],[50,-132],[60,-145]],
  [[12,-70],[5,-76],[0,-80],[-5,-80],[-12,-76],[-20,-65],[-28,-55],[-35,-58],[-45,-68],[-55,-68],[-50,-60],[-38,-48],[-24,-42],[-12,-37],[0,-50],[8,-62],[12,-70]],
  [[36,-8],[40,0],[43,5],[48,-2],[52,5],[56,14],[60,28],[65,28],[70,28],[68,15],[62,5],[55,-5],[48,-10],[40,-4],[36,-8]],
  [[37,10],[36,32],[28,34],[16,42],[5,48],[0,42],[-10,40],[-20,34],[-30,28],[-35,20],[-34,18],[-22,12],[-5,8],[5,-5],[16,-16],[24,-14],[32,-4],[37,10]],
  [[42,28],[42,52],[38,58],[45,72],[38,78],[28,90],[22,100],[18,105],[25,110],[32,120],[38,130],[45,140],[55,160],[65,180],[70,150],[58,130],[50,100],[55,80],[55,55],[48,48],[42,28]],
  [[-20,115],[-14,130],[-16,140],[-24,150],[-34,148],[-38,143],[-30,128],[-22,114],[-20,115]]
];
const CURS=['USD','EUR','GBP','JPY','CHF','SGD'];

// Globe state
S.txVol=rand(2e9,3.5e9);S.corridors=randInt(40,65);S.txH=[];
S.globeRotY=0;S.globeRotX=0.3;S.globeZoom=1;S.globeDrag=false;S.globeLastMouse=null;
S.globeArcs=Array.from({length:8},()=>({from:pick(CITIES),to:pick(CITIES),progress:rand(0,1),speed:rand(.003,.008)}));
for(let i=0;i<12;i++)S.txH.push({id:uid(),from:pick(CITIES).n,to:pick(CITIES).n,amt:rand(5e4,2e7),cur:pick(CURS),time:utc()});

// ═══════ GOALS ═══════
const GOALS=[
  {name:'Retirement',target:5000000,current:3240000,color:'#60a5fa',eta:'2042'},
  {name:'Emergency Fund',target:500000,current:425000,color:'#34d399',eta:'2026'},
  {name:'Home Purchase',target:2000000,current:1680000,color:'#a78bfa',eta:'2028'},
  {name:'Education',target:3000000,current:890000,color:'#D4AF37',eta:'2035'},
];

// ═══════ SCENARIOS ═══════
const SCENARIOS=[
  {n:'Market Correction',desc:'Simulate a 10% broad market decline',impact:-10},
  {n:'High Inflation',desc:'8% inflation scenario analysis',impact:-6},
  {n:'Tech Downturn',desc:'30% decline in technology sector',impact:-15},
  {n:'Rate Cut Cycle',desc:'Fed cuts rates by 150bps',impact:8},
  {n:'Bull Rally',desc:'20% market surge over 6 months',impact:12},
];

// ═══════ FEATURE FLAGS ═══════
const FEATURES={payments:true,wallet:true,compliance:true,analytics:true,notifications:true,smartInsights:true,marketData:true,adminPanel:true};

// ═══════ HELPERS ═══════
function kpi(l,v,d,dir,c){return`<div class="nx-kpi ${c}"><div class="nx-kpi__label">${l}</div><div class="nx-kpi__value">${v}</div><div class="nx-kpi__delta ${dir}">${dir==='up'?'▲':'▼'} ${d}</div></div>`}
window.toast=function(msg,type='info'){const el=document.createElement('div');el.className='nx-toast nx-toast--'+type;el.innerHTML=`<span class="nx-toast__icon">${type==='success'?'✓':type==='danger'?'✕':type==='warn'?'⚠':'ℹ'}</span><span>${msg}</span>`;$('#toastContainer').appendChild(el);setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),300)},4000)};

// Auth helpers
function authLogin(email,pass){
  const u=DEMO_USERS.find(u=>u.email===email&&u.pass===pass);
  if(!u)return{ok:false,msg:'Invalid email or password'};
  S.loggedIn=true;S.currentUser=u;S.isAdmin=u.role!=='user';
  localStorage.setItem('nx_session',JSON.stringify({id:u.id,email:u.email,role:u.role}));
  addAuditLog('auth','Login successful',u.name);
  return{ok:true,user:u};
}
function authLogout(){S.loggedIn=false;S.currentUser=null;S.isAdmin=false;localStorage.removeItem('nx_session')}
function authRestore(){
  const s=localStorage.getItem('nx_session');if(!s)return false;
  try{const d=JSON.parse(s);const u=DEMO_USERS.find(x=>x.id===d.id);if(u){S.loggedIn=true;S.currentUser=u;S.isAdmin=u.role!=='user';return true}}catch(e){}return false;
}
function hasAccess(page){if(!S.currentUser)return false;return ROLES[S.currentUser.role]?.pages.includes(page)}
function addAuditLog(type,action,user){S.auditLog.unshift({id:uid(),type,action,user:user||S.currentUser?.name||'System',time:new Date().toISOString(),ip:'192.168.1.'+randInt(1,254)});if(S.auditLog.length>100)S.auditLog.pop()}

// Initialize some audit logs
['Login successful','Password changed','2FA enabled','KYC approved: User U004','Transaction reversed: NX-A82F','User suspended: U005','Compliance report generated','Rate alert triggered'].forEach((a,i)=>{
  addAuditLog(i<2?'auth':i<4?'security':i<6?'admin':'system',a,pick(DEMO_USERS).name)});
