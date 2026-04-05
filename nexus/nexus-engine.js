// NEXA v1.0 — Beyond Fintech | Engine
function init(){
  if(authRestore()){showApp();renderAll()}else showAuth();
  initParticles();
}
function showAuth(){$('#authScreen').classList.remove('hidden');$('#topbar').style.display='none';$('#sidebar').style.display='none';$('#main').style.display='none';initAuthHandlers()}
function showApp(){$('#authScreen').classList.add('hidden');$('#topbar').style.display='flex';$('#sidebar').style.display='flex';$('#main').style.display='block';
  if(S.currentUser){$('#userName').textContent=S.currentUser.name.split(' ')[0];$('#userAvatar').textContent=S.currentUser.avatar}
  if(S.isAdmin){$('#adminSection').style.display='block';
    const role=S.currentUser.role,pages=ROLES[role].pages;
    ['admin_dash','admin_users','admin_tx','admin_risk','admin_compliance','admin_analytics'].forEach(p=>{
      const el=$(`[data-page="${p}"]`);if(el)el.style.display=pages.includes(p)?'flex':'none'});
    $('#adminSection').style.display=pages.some(p=>p.startsWith('admin_'))?'block':'none'}
}
function renderAll(){
  setupNav();setupTimezone();setupTimeFilters();
  renderDashboard();renderInsights();renderCurrencyCards();renderEcoCards();renderGoals();renderRecentTx();
  renderMarkets();drawHeatmap();renderPortfolio();renderGlobeKpis();renderGlobeFeed();renderCurrencyGrid();
  renderTransactions();renderAccounts();renderWealthDNA();renderTransferList();
  renderProfile();renderSupport();renderSecurity();renderAuditLog();renderSettings();
  if(S.isAdmin){renderAdminDash();renderAdminUsers();renderAdminTx();renderAdminRisk();renderAdminCompliance();renderAdminAnalytics()}
  initTicker();initTheme();initCmdPalette();initNotifDrawer();initTransferForm();initSupportForm();initProfileForm();
  startSim();
}
// ═══════ AUTH ═══════
function initAuthHandlers(){
  $('#loginBtn').onclick=()=>{const e=$('#loginEmail').value,p=$('#loginPass').value;
    if(!e||!p){showAuthError('Please fill in all fields');return}
    const r=authLogin(e,p);if(r.ok){showApp();renderAll();toast('Welcome back, '+r.user.name.split(' ')[0],'success')}else{showAuthError(r.msg)}};
  $('#signupBtn').onclick=()=>{const n=$('#signupName').value,e=$('#signupEmail').value,p=$('#signupPass').value;
    if(!n||!e||!p){showAuthError('Please fill in all fields');return}
    DEMO_USERS.push({id:'U'+Date.now(),name:n,email:e,pass:p,role:'user',avatar:n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),phone:'',joined:new Date().toISOString().slice(0,10),status:'active',kyc:'pending'});
    const r=authLogin(e,p);if(r.ok){showApp();renderAll();toast('Account created! Welcome to NEXA','success')}};
  $('#showSignup').onclick=()=>{$('#authLogin').style.display='none';$('#authSignup').style.display='block'};
  $('#showLogin').onclick=()=>{$('#authSignup').style.display='none';$('#authLogin').style.display='block'};
  ['loginEmail','loginPass'].forEach(id=>$('#'+id).addEventListener('keydown',e=>{if(e.key==='Enter')$('#loginBtn').click()}));
}
function showAuthError(msg){const el=$('#authError');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3000)}
// ═══════ NAV ═══════
function setupNav(){$$('.nx-nav__item').forEach(b=>{b.addEventListener('click',()=>{
  if(!hasAccess(b.dataset.page)){toast('Access denied','danger');return}
  $$('.nx-nav__item').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  $$('.nx-page').forEach(p=>p.classList.remove('active'));
  const pg=$('#page-'+b.dataset.page);
  if(pg){pg.classList.add('active');S.currentPage=b.dataset.page;
    requestAnimationFrame(()=>{const p=b.dataset.page;
      if(p==='globe')drawGlobe();
      if(p==='markets'){drawStockChart();drawHeatmap()}
      if(p==='portfolio'){drawLineChart($('#portChart'),S.portH,'#34d399');drawDonut()}
      if(p==='accounts')renderWealthDNA();
      if(p==='admin_dash'){drawAdminRevenue()}
      if(p==='admin_analytics'){drawRetention();drawRiskDist()}
    })}})});
  $('#logoHome').onclick=()=>{const d=$('.nx-nav__item[data-page="dashboard"]');if(d)d.click()};
  $('#logoutBtn').onclick=()=>{authLogout();showAuth();toast('Signed out','info')};
}
function navigateTo(pg){const b=$('.nx-nav__item[data-page="'+pg+'"]');if(b)b.click()}
function setupTimezone(){const h=new Date().getHours();$('#greetTitle').textContent=h<12?'Good morning':h<17?'Good afternoon':'Good evening'}
function setupTimeFilters(){$$('.nx-time-filters').forEach(g=>{g.querySelectorAll('button').forEach(b=>{b.addEventListener('click',()=>{g.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active')})})})}
// ═══════ DASHBOARD ═══════
function renderDashboard(){
  const tb=S.accounts.reduce((s,a)=>s+a.bal,0);
  $('#dashKpis').innerHTML=[kpi('Total Balance',fmtM(tb),fmtP(S.monthGrowth),'up','blue'),kpi('Investments',fmtM(S.holdings.reduce((s,h)=>s+h.v,0)),fmtP(S.portfolioReturn),'up','gold'),kpi('Health Score',S.healthScore+'/100','Top 5%','up','emerald'),kpi('Security','Active','Protected','up','cyan')].join('');
  const c=$('#perfChart');if(c&&c.parentElement.offsetWidth)drawLineChart(c,S.perfH,'#60a5fa');
  const summary=['Strong earnings season. Your diversification is excellent at 8.4/10.','Markets trending positive. Portfolio outperforming benchmark by 4.2%.','Financial health score: '+S.healthScore+'/100. All accounts in good standing.'];
  $('#aiSummary').textContent=pick(summary);
}
function renderInsights(){$('#dashInsights').innerHTML=INSIGHTS.slice(0,5).map(i=>`<div class="nx-insight ${i.type}"><h4>${i.title}</h4><p>${i.body}</p></div>`).join('')}
function renderCurrencyCards(){
  const c=CURRENCIES;
  $('#usdInrCard').innerHTML=`<div class="nx-currency-card__pair">${c[0].from} → ${c[0].to}</div><div class="nx-currency-card__rate">${c[0].rate.toFixed(2)}</div><div class="nx-currency-card__change ${c[0].change>=0?'up':'down'}">${c[0].change>=0?'▲':'▼'} ${Math.abs(c[0].change).toFixed(3)}</div>`;
  $('#usdEurCard').innerHTML=`<div class="nx-currency-card__pair">${c[1].from} → ${c[1].to}</div><div class="nx-currency-card__rate">${c[1].rate.toFixed(4)}</div><div class="nx-currency-card__change ${c[1].change>=0?'up':'down'}">${c[1].change>=0?'▲':'▼'} ${Math.abs(c[1].change).toFixed(4)}</div>`;
}
function renderEcoCards(){
  $('#inflationCard').innerHTML=`<div class="nx-eco-card__label">Inflation Rate</div><div class="nx-eco-card__value">${INFLATION.current}%</div><div class="nx-eco-card__trend ${INFLATION.trend}">${INFLATION.trend}</div>`;
  $('#interestCard').innerHTML=`<div class="nx-eco-card__label">Interest Rate</div><div class="nx-eco-card__value">${INTEREST_RATE.current}%</div><div class="nx-eco-card__trend ${INTEREST_RATE.trend}">${INTEREST_RATE.trend}</div>`;
}
function renderGoals(){$('#goalTracker').innerHTML=GOALS.map(g=>{const pct=Math.round(g.current/g.target*100);return`<div class="nx-goal"><div class="nx-goal__ring"><canvas width="70" height="70" data-pct="${pct}" data-color="${g.color}"></canvas><div class="nx-goal__pct">${pct}%</div></div><div class="nx-goal__name">${g.name}</div><div class="nx-goal__detail">${fmtM(g.current)} / ${fmtM(g.target)}</div></div>`}).join('');
  $$('.nx-goal__ring canvas').forEach(c=>{const ctx=c.getContext('2d'),pct=+c.dataset.pct,col=c.dataset.color;ctx.beginPath();ctx.arc(35,35,28,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=5;ctx.stroke();ctx.beginPath();ctx.arc(35,35,28,-Math.PI/2,-Math.PI/2+pct/100*Math.PI*2);ctx.strokeStyle=col;ctx.lineWidth=5;ctx.lineCap='round';ctx.stroke()})}
function renderRecentTx(){$('#dashRecentTx').innerHTML=S.transactions.slice(0,6).map(txRow).join('')}
function txRow(t){return`<div class="nx-tx-row"><div class="nx-tx-row__icon ${t.type}">${t.type==='credit'?'↓':'↑'}</div><div class="nx-tx-row__info"><div class="nx-tx-row__merchant">${t.merchant}</div><div class="nx-tx-row__cat">${t.cat} · ${t.date}</div></div><div class="nx-tx-row__right"><div class="nx-tx-row__amt ${t.type}">${t.type==='credit'?'+':'-'}$${fmt(Math.round(t.amt))}</div><span class="nx-tx-row__status ${t.status}">${t.status}</span></div></div>`}
// ═══════ MARKETS ═══════
function renderMarkets(){
  $('#indexKpis').innerHTML=INDICES.map(idx=>kpi(idx.n,fmt(Math.round(idx.v)),fmtP(idx.c),idx.c>=0?'up':'down',idx.c>=0?'emerald':'rose')).join('');
  renderStockList();drawStockChart();
  const mood=S.sentiment==='bullish'?'Positive Trend':'cautious';$('#marketMood').innerHTML=`<span class="nx-live-dot"></span>${mood}`;
}
function renderStockList(){$('#stockList').innerHTML=STOCKS.map((s,i)=>`<div class="nx-stock ${i===S.selectedStock?'selected':''}" data-idx="${i}"><span class="nx-stock__sym">${s.sym}</span><span class="nx-stock__name">${s.name}</span><span class="nx-stock__price">$${s.price.toFixed(2)}</span><span class="nx-stock__change ${s.changePct>=0?'up':'down'}">${s.changePct>=0?'▲':'▼'}${Math.abs(s.changePct).toFixed(2)}%</span></div>`).join('');
  $$('.nx-stock').forEach(el=>{el.onclick=()=>{S.selectedStock=+el.dataset.idx;renderStockList();drawStockChart();$('#stockChartTitle').textContent=STOCKS[S.selectedStock].sym+' — '+STOCKS[S.selectedStock].name}})}
function sizeCanvas(c){const p=c.parentElement;c.width=p.clientWidth-24;return{W:c.width,H:c.height}}
function drawLineChart(c,data,color){if(!c||!c.parentElement.offsetWidth)return;const{W,H}=sizeCanvas(c);const ctx=c.getContext('2d');ctx.clearRect(0,0,W,H);const pad=20,vals=data.map(d=>d.v),max=Math.max(...vals)*1.02,min=Math.min(...vals)*.98;
  ctx.beginPath();vals.forEach((v,i)=>{const x=pad+i*((W-pad*2)/(vals.length-1)),y=pad+(1-(v-min)/(max-min))*(H-pad*2);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});
  const lg=ctx.createLinearGradient(0,0,0,H);lg.addColorStop(0,color);lg.addColorStop(1,color+'33');ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
  ctx.lineTo(pad+(vals.length-1)*((W-pad*2)/(vals.length-1)),H-pad);ctx.lineTo(pad,H-pad);ctx.closePath();const g=ctx.createLinearGradient(0,pad,0,H-pad);g.addColorStop(0,color+'22');g.addColorStop(1,color+'02');ctx.fillStyle=g;ctx.fill();
  const last=vals[vals.length-1],lx=pad+(vals.length-1)*((W-pad*2)/(vals.length-1)),ly=pad+(1-(last-min)/(max-min))*(H-pad*2);
  ctx.beginPath();ctx.arc(lx,ly,4,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.fillStyle=color;ctx.font='bold 11px JetBrains Mono';ctx.textAlign='left';ctx.fillText(typeof last==='number'&&last>1000?'$'+fmt(Math.round(last)):last.toFixed(2),lx+8,ly+4)}
function drawStockChart(){const c=$('#stockChart');if(!c)return;drawLineChart(c,STOCKS[S.selectedStock].hist.map(v=>({v})),'#34d399')}
function drawHeatmap(){const c=$('#heatmapCanvas');if(!c||!c.parentElement.offsetWidth)return;const p=c.parentElement;c.width=p.clientWidth-24;const W=c.width,H=c.height,ctx=c.getContext('2d');ctx.clearRect(0,0,W,H);
  const total=SECTORS.reduce((s,sec)=>s+sec.w,0);let x=12;
  SECTORS.forEach(sec=>{const w=(sec.w/total)*(W-24),col=sec.c>=0?`rgba(52,211,153,${Math.min(.8,Math.abs(sec.c)/5)})`:`rgba(251,113,133,${Math.min(.8,Math.abs(sec.c)/5)})`;
    ctx.fillStyle=col;ctx.beginPath();const r=4;ctx.moveTo(x+r,16);ctx.lineTo(x+w-r,16);ctx.quadraticCurveTo(x+w,16,x+w,16+r);ctx.lineTo(x+w,H-16-r);ctx.quadraticCurveTo(x+w,H-16,x+w-r,H-16);ctx.lineTo(x+r,H-16);ctx.quadraticCurveTo(x,H-16,x,H-16-r);ctx.lineTo(x,16+r);ctx.quadraticCurveTo(x,16,x+r,16);ctx.fill();
    if(w>40){ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='bold 10px Inter';ctx.textAlign='center';ctx.fillText(sec.n,x+w/2,H/2-4);ctx.fillStyle=sec.c>=0?'#34d399':'#fb7185';ctx.font='bold 9px JetBrains Mono';ctx.fillText(fmtP(sec.c),x+w/2,H/2+10)}
    x+=w+3})}
// ═══════ PORTFOLIO ═══════
function renderPortfolio(){
  const tv=S.holdings.reduce((s,h)=>s+h.v,0),pl=tv*S.portfolioReturn/100;
  $('#portKpis').innerHTML=[kpi('Portfolio Value',fmtM(tv),fmtP(S.portfolioReturn),'up','blue'),kpi('Total P&L','+'+fmtM(pl),'Year to date','up','emerald'),kpi('Diversification','8.4/10','Well balanced','up','gold'),kpi('Risk Level','Low','Moderate exposure','up','cyan')].join('');
  const c=$('#portChart');if(c&&c.parentElement.offsetWidth)drawLineChart(c,S.portH,'#34d399');
  drawDonut();
  $('#holdingsList').innerHTML=S.holdings.map(h=>`<div class="nx-holding"><div><div style="font-size:12px;font-weight:600">${h.n}</div><div style="font-family:var(--fontM);font-size:9px;color:var(--textD)">${h.t} · ${h.alloc}% allocation</div></div><div style="text-align:right"><div style="font-family:var(--fontM);font-size:12px;font-weight:600">${fmtM(h.v)}</div><div style="font-size:10px;font-weight:600;color:${h.c>=0?'var(--emerald)':'var(--rose)'}">${h.c>=0?'▲':'▼'} ${Math.abs(h.c).toFixed(2)}%</div></div></div>`).join('');
  $('#portRecs').innerHTML=[{t:'Rebalance suggestion',d:'Equity allocation 8% above target. Consider trimming to lock in gains.',tag:'hold'},{t:'Tax optimization',d:'Harvesting losses on EEM could save ~$3,200 in taxes.',tag:'review'},{t:'Dividend opportunity',d:'AAPL ex-dividend date approaching. Hold for $0.96/share payout.',tag:'hold'}].map(r=>`<div class="nx-insight recommendation"><h4>${r.t}</h4><p>${r.d}</p></div>`).join('');
}
function drawDonut(){const c=$('#allocChart');if(!c||!c.parentElement.offsetWidth)return;const ctx=c.getContext('2d');c.width=c.parentElement.clientWidth-24;ctx.clearRect(0,0,c.width,c.height);
  const cx=c.width/2,cy=120,r=80,tv=S.holdings.reduce((s,h)=>s+h.v,0);let a=-Math.PI/2;
  S.holdings.forEach(h=>{const sa=a,ea=a+h.alloc/100*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,sa,ea);ctx.arc(cx,cy,r*.6,ea,sa,true);ctx.closePath();ctx.fillStyle=h.color;ctx.fill();a=ea});
  ctx.fillStyle='var(--text)';ctx.font='bold 16px JetBrains Mono';ctx.textAlign='center';ctx.fillText(fmtM(tv),cx,cy+4);ctx.fillStyle='var(--textD)';ctx.font='9px Inter';ctx.fillText('Total Value',cx,cy+18);
  $('#allocLegend').innerHTML=S.holdings.map(h=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:11px"><div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:${h.color};display:inline-block"></span>${h.n}</div><span style="font-weight:600">${h.alloc}%</span></div>`).join('')}
// ═══════ GLOBE ═══════
function renderGlobeKpis(){$('#globeKpis').innerHTML=[kpi('Transaction Volume',fmtM(S.txVol),'+12.4%','up','blue'),kpi('Active Corridors',S.corridors+'','+3 this week','up','gold'),kpi('Settlement Rate','99.7%','Above target','up','emerald'),kpi('Markets Active','14/20','Peak hours','up','cyan')].join('')}
function renderGlobeFeed(){$('#globeTxFeed').innerHTML=S.txH.slice(0,8).map(t=>`<div class="nx-tx-row"><div class="nx-tx-row__info"><div class="nx-tx-row__merchant">${t.from} → ${t.to}</div></div><div class="nx-tx-row__right"><div class="nx-tx-row__amt credit">${t.cur} ${fmtM(t.amt)}</div><div style="font-size:9px;color:var(--textD)">${t.time}</div></div></div>`).join('')}
function renderCurrencyGrid(){$('#currencyGrid').innerHTML=CURRENCIES.map(c=>`<div class="nx-currency-card"><div class="nx-currency-card__pair">${c.from} → ${c.to}</div><div class="nx-currency-card__rate">${c.rate<10?c.rate.toFixed(4):c.rate.toFixed(2)}</div><div class="nx-currency-card__change ${c.change>=0?'up':'down'}">${c.change>=0?'▲':'▼'} ${Math.abs(c.change).toFixed(c.rate<10?4:2)}</div></div>`).join('')}
// ═══════ TRANSACTIONS ═══════
function renderTransactions(){
  const search=$('#txSearch')?.value?.toLowerCase()||'',type=$('#txFilterType')?.value||'',status=$('#txFilterStatus')?.value||'';
  let txs=S.transactions;
  if(search)txs=txs.filter(t=>t.merchant.toLowerCase().includes(search)||t.id.toLowerCase().includes(search));
  if(type)txs=txs.filter(t=>t.type===type);if(status)txs=txs.filter(t=>t.status===status);
  $('#txList').innerHTML=txs.length?txs.map(txRow).join(''):'<div class="nx-empty"><div class="nx-empty__icon">⇄</div><div class="nx-empty__title">No transactions found</div><div class="nx-empty__desc">Try adjusting your filters</div></div>';
  ['txSearch','txFilterType','txFilterStatus'].forEach(id=>{const el=$('#'+id);if(el&&!el._bound){el._bound=true;el.addEventListener(id==='txSearch'?'input':'change',renderTransactions)}});
  const btn=$('#newTxBtn');if(btn&&!btn._bound){btn._bound=true;btn.onclick=()=>navigateTo('transfers')}
}
// ═══════ ACCOUNTS ═══════
function renderAccounts(){
  const tb=S.accounts.reduce((s,a)=>s+a.bal,0);
  $('#acctKpis').innerHTML=[kpi('Total Balance',fmtM(tb),fmtP(S.monthGrowth),'up','blue'),kpi('Accounts',''+S.accounts.length,'All active','up','emerald'),kpi('Best Rate','4.85%','Premium Savings','up','gold'),kpi('This Month','+$'+fmt(Math.round(tb*S.monthGrowth/100)),'Growth','up','cyan')].join('');
  $('#acctCards').innerHTML=S.accounts.map(a=>`<div class="nx-kpi blue" style="cursor:pointer"><div class="nx-kpi__label">${a.type}</div><div style="font-size:13px;font-weight:600;margin-bottom:4px">${a.name}</div><div class="nx-kpi__value" style="color:var(--blue)">${fmtM(a.bal)}</div><div style="font-size:10px;color:var(--emerald);margin-top:4px">APY: ${a.rate}</div><div style="font-family:var(--fontM);font-size:9px;color:var(--textD);margin-top:2px">${a.id}</div></div>`).join('');
  $('#spendInsights').innerHTML=S.spending.map(s=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.03)"><div style="display:flex;align-items:center;gap:8px"><span style="width:10px;height:10px;border-radius:2px;background:${s.color};display:inline-block"></span><span style="font-size:11px">${s.cat}</span></div><span style="font-family:var(--fontM);font-size:11px;font-weight:600">${s.pct}%</span></div>`).join('');
}
function renderWealthDNA(){const c=$('#radarChart');if(!c||!c.parentElement.offsetWidth)return;c.width=c.parentElement.clientWidth-24;const ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2-10,r=Math.min(W,H)*.35;
  const labels=['Risk','Savings','Diversity','Growth','Liquidity','Discipline'],vals=[72,88,84,76,65,91],n=labels.length;
  for(let ring=3;ring>=1;ring--){ctx.beginPath();for(let i=0;i<=n;i++){const a=-Math.PI/2+i/n*Math.PI*2,x=cx+(r*ring/3)*Math.cos(a),y=cy+(r*ring/3)*Math.sin(a);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;ctx.stroke()}
  ctx.beginPath();vals.forEach((v,i)=>{const a=-Math.PI/2+i/n*Math.PI*2,x=cx+(v/100*r)*Math.cos(a),y=cy+(v/100*r)*Math.sin(a);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.closePath();ctx.fillStyle='rgba(96,165,250,.12)';ctx.fill();ctx.strokeStyle='#60a5fa';ctx.lineWidth=2;ctx.stroke();
  labels.forEach((l,i)=>{const a=-Math.PI/2+i/n*Math.PI*2,x=cx+(r+16)*Math.cos(a),y=cy+(r+16)*Math.sin(a);ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='9px Inter';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(l,x,y)});
  $('#wealthDNA').innerHTML=`<div style="font-size:12px;font-weight:700;color:var(--gold)">Strategic Builder</div><div style="font-size:10px;color:var(--textM);margin-top:3px">Disciplined saver with strong diversification instincts.</div>`}
// ═══════ TRANSFERS ═══════
function renderTransferList(){$('#transferList').innerHTML=S.transactions.filter(t=>t.cat==='Transfer').slice(0,8).map(txRow).join('')||'<div class="nx-empty"><div class="nx-empty__title">No recent transfers</div></div>'}
function initTransferForm(){$('#tfSend').onclick=()=>{const r=$('#tfRecipient').value,a=+$('#tfAmount').value;
  if(!r){toast('Please enter a recipient','warn');return}if(!a||a<=0){toast('Please enter a valid amount','warn');return}
  S.transactions.unshift({id:uid(),type:'debit',cat:'Transfer',merchant:r,amt:a,date:new Date().toISOString().slice(0,10),time:utc(),status:'completed',riskScore:randInt(0,30),note:$('#tfNote').value});
  S.accounts[0].bal-=a;toast('$'+fmt(Math.round(a))+' sent to '+r,'success');
  $('#tfRecipient').value='';$('#tfAmount').value='';$('#tfNote').value='';renderTransferList();renderRecentTx();renderDashboard();addAuditLog('admin','Transfer: $'+fmt(Math.round(a))+' to '+r)}}
// ═══════ PROFILE ═══════
function renderProfile(){if(!S.currentUser)return;const u=S.currentUser;
  $('#profileHeader').innerHTML=`<div class="nx-profile-avatar">${u.avatar}</div><div class="nx-profile-info"><h2>${u.name}</h2><p>${ROLES[u.role].label} · Joined ${u.joined}</p><p style="margin-top:4px"><span class="nx-badge nx-badge--emerald">KYC ${u.kyc}</span> <span class="nx-badge nx-badge--blue">${u.status}</span></p></div>`;
  $('#profName').value=u.name;$('#profEmail').value=u.email;$('#profPhone').value=u.phone;
  $('#profActivity').innerHTML=S.auditLog.filter(l=>l.user===u.name).slice(0,8).map(l=>`<div class="nx-audit-entry"><div class="nx-audit-entry__icon ${l.type}">◈</div><div style="flex:1"><div style="font-size:11px;font-weight:600">${l.action}</div><div style="font-size:9px;color:var(--textD)">${new Date(l.time).toLocaleString()}</div></div></div>`).join('')||'<div class="nx-empty"><div class="nx-empty__title">No recent activity</div></div>'}
function initProfileForm(){$('#profSave').onclick=()=>{S.currentUser.name=$('#profName').value;S.currentUser.email=$('#profEmail').value;S.currentUser.phone=$('#profPhone').value;toast('Profile updated','success');addAuditLog('auth','Profile updated');renderProfile()}}
// ═══════ SUPPORT ═══════
function renderSupport(){$('#supportTickets').innerHTML=SUPPORT_TICKETS.map(t=>`<div class="nx-insight ${t.status==='open'?'alert':t.status==='in_progress'?'insight':'security'}"><h4>${t.subject}</h4><p>${t.id} · ${t.status.replace('_',' ')} · ${t.created}</p></div>`).join('')}
function initSupportForm(){$('#supportSubmit').onclick=()=>{const s=$('#supportSubject').value,d=$('#supportDesc').value;
  if(!s){toast('Please enter a subject','warn');return}
  SUPPORT_TICKETS.unshift({id:'TK-'+randInt(100,999),subject:s,status:'open',priority:'medium',created:new Date().toISOString().slice(0,10),messages:0});
  toast('Support request submitted','success');$('#supportSubject').value='';$('#supportDesc').value='';renderSupport();addAuditLog('system','Support ticket created: '+s)}}
// ═══════ SECURITY ═══════
function renderSecurity(){$('#securityCards').innerHTML=[{t:'Encryption',d:'AES-256 bank-grade encryption','i':'◈'},{t:'Two-Factor Auth',d:'Enabled via authenticator app','i':'⛨'},{t:'Biometric Login',d:'Fingerprint and face recognition','i':'○'},{t:'Session Management',d:'Active monitoring of all sessions','i':'⊡'},{t:'Fraud Protection',d:'Real-time transaction monitoring','i':'⚡'},{t:'Data Privacy',d:'GDPR and SOC 2 compliant','i':'☐'}].map(c=>`<div class="nx-security-card"><div style="font-size:24px;margin-bottom:6px">${c.i}</div><div style="font-size:12px;font-weight:600;margin-bottom:2px">${c.t}</div><div style="font-size:10px;color:var(--textM)">${c.d}</div></div>`).join('')}
function renderAuditLog(){const el=$('#auditLog');if(!el)return;el.innerHTML=S.auditLog.slice(0,10).map(l=>`<div class="nx-audit-entry"><div class="nx-audit-entry__icon ${l.type}">◈</div><div style="flex:1"><div style="font-size:11px;font-weight:600">${l.action}</div><div style="font-size:9px;color:var(--textD)">${l.user} · ${new Date(l.time).toLocaleString()}</div></div></div>`).join('')}
// ═══════ SETTINGS ═══════
function renderSettings(){
  $('#featureFlags').innerHTML=Object.entries(FEATURES).map(([k,v])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03)"><span style="font-size:12px;font-weight:500;text-transform:capitalize">${k.replace(/([A-Z])/g,' $1')}</span><button class="nx-toggle ${v?'on':'off'}" data-feat="${k}"></button></div>`).join('');
  $$('.nx-toggle').forEach(t=>{t.onclick=()=>{const f=t.dataset.feat;FEATURES[f]=!FEATURES[f];t.className='nx-toggle '+(FEATURES[f]?'on':'off');toast(f+' '+(FEATURES[f]?'enabled':'disabled'),'info')}});
  const pref=[{n:'Dark Mode',d:'Use dark theme'},             {n:'Notifications',d:'Push notifications enabled'},{n:'Biometric Login',d:'Use fingerprint or face ID'},{n:'Auto-refresh',d:'Live data updates'}];
  $('#preferences').innerHTML=pref.map(p=>`<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03)"><div style="font-size:11px;font-weight:500">${p.n}</div><div style="font-size:10px;color:var(--textD)">${p.d}</div></div>`).join('');
}
// ═══════ ADMIN ═══════
function renderAdminDash(){
  const m=ADMIN_METRICS;
  $('#adminStats').innerHTML=[
    `<div class="nx-admin-stat"><div class="nx-admin-stat__value">${fmt(m.totalUsers)}</div><div class="nx-admin-stat__label">Total Users</div><div class="nx-admin-stat__delta" style="color:var(--emerald)">+${m.newThisMonth} this month</div></div>`,
    `<div class="nx-admin-stat"><div class="nx-admin-stat__value">${fmt(m.activeToday)}</div><div class="nx-admin-stat__label">Active Today</div></div>`,
    `<div class="nx-admin-stat"><div class="nx-admin-stat__value">${fmtM(m.totalTxVolume)}</div><div class="nx-admin-stat__label">Transaction Volume</div></div>`,
    `<div class="nx-admin-stat"><div class="nx-admin-stat__value">${m.flaggedTx}</div><div class="nx-admin-stat__label">Flagged Transactions</div><div class="nx-admin-stat__delta" style="color:var(--emerald)">${m.resolvedToday} resolved today</div></div>`,
  ].join('');
  drawAdminRevenue();
  $('#adminActivityFeed').innerHTML=S.auditLog.slice(0,10).map(l=>`<div class="nx-audit-entry"><div class="nx-audit-entry__icon ${l.type}">◈</div><div style="flex:1"><div style="font-size:11px;font-weight:600">${l.action}</div><div style="font-size:9px;color:var(--textD)">${l.user} · ${new Date(l.time).toLocaleString()}</div></div></div>`).join('');
}
function drawAdminRevenue(){const c=$('#adminRevenueChart');if(!c||!c.parentElement.offsetWidth)return;drawLineChart(c,ADMIN_METRICS.revenue.monthly.map(v=>({v})),'#D4AF37')}
function renderAdminUsers(){
  $('#adminUserBody').innerHTML=DEMO_USERS.map(u=>`<tr><td><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--gold));display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff">${u.avatar}</div><span style="font-weight:600">${u.name}</span></div></td><td style="color:var(--textM)">${u.email}</td><td><span class="nx-badge nx-badge--${u.role==='super_admin'?'gold':'blue'}">${ROLES[u.role].label}</span></td><td><span class="nx-badge nx-badge--${u.kyc==='verified'?'emerald':'amber'}">${u.kyc}</span></td><td><span class="nx-badge nx-badge--${u.status==='active'?'emerald':'rose'}">${u.status}</span></td><td><button class="nx-admin-action" onclick="toast('Action simulated','info');addAuditLog('admin','Admin action on: ${u.name}')">Manage</button></td></tr>`).join('');
}
function renderAdminTx(){
  const flagged=S.transactions.filter(t=>t.status==='flagged').length;
  $('#adminTxKpis').innerHTML=[kpi('Total Transactions',''+S.transactions.length,'Today','up','blue'),kpi('Flagged',''+flagged,'Needs review','up','rose'),kpi('Avg Amount','$'+fmt(Math.round(S.transactions.reduce((s,t)=>s+t.amt,0)/S.transactions.length)),'Per transaction','up','gold')].join('');
  $('#adminTxBody').innerHTML=S.transactions.slice(0,15).map(t=>`<tr><td style="font-family:var(--fontM);font-size:10px;color:var(--textD)">${t.id}</td><td><span class="nx-badge nx-badge--${t.type==='credit'?'emerald':'rose'}">${t.type}</span></td><td>${t.merchant}</td><td style="font-family:var(--fontM);font-weight:600">$${fmt(Math.round(t.amt))}</td><td><span class="nx-badge nx-badge--${t.status==='completed'?'emerald':t.status==='flagged'?'rose':'amber'}">${t.status}</span></td><td><div style="width:40px;height:4px;border-radius:2px;background:${t.riskScore>70?'var(--rose)':t.riskScore>40?'var(--amber)':'var(--emerald)'}"></div></td><td>${t.status==='flagged'?'<button class="nx-admin-action danger" onclick="this.closest(\'tr\').remove();toast(\'Transaction flagged for review\',\'warn\')">Review</button>':''}</td></tr>`).join('');
}
function renderAdminRisk(){
  const d=ADMIN_METRICS.riskDistribution;
  $('#riskDistribution').innerHTML=[{l:'Low Risk',v:d.low+'%',c:'emerald'},{l:'Medium Risk',v:d.medium+'%',c:'amber'},{l:'High Risk',v:d.high+'%',c:'rose'}].map(r=>`<div class="nx-admin-stat"><div class="nx-admin-stat__value" style="color:var(--${r.c})">${r.v}</div><div class="nx-admin-stat__label">${r.l}</div></div>`).join('');
  $('#adminAuditLog').innerHTML=S.auditLog.slice(0,15).map(l=>`<div class="nx-audit-entry"><div class="nx-audit-entry__icon ${l.type}">◈</div><div style="flex:1"><div style="font-size:11px;font-weight:600">${l.action}</div><div style="font-size:9px;color:var(--textD)">${l.user} · ${l.ip} · ${new Date(l.time).toLocaleString()}</div></div></div>`).join('');
}
function renderAdminCompliance(){$('#kycQueueBody').innerHTML=KYC_QUEUE.map(k=>`<tr><td style="font-weight:600">${k.name}</td><td>${k.docType}</td><td style="color:var(--textD)">${k.submitted}</td><td><span class="nx-badge nx-badge--${k.riskLevel==='low'?'emerald':k.riskLevel==='medium'?'amber':'rose'}">${k.riskLevel}</span></td><td style="display:flex;gap:4px"><button class="nx-admin-action" onclick="toast('KYC Approved','success');this.closest('tr').remove();addAuditLog('admin','KYC approved: ${k.name}')">Approve</button><button class="nx-admin-action danger" onclick="toast('KYC Rejected','danger');this.closest('tr').remove();addAuditLog('admin','KYC rejected: ${k.name}')">Reject</button></td></tr>`).join('')}
function renderAdminAnalytics(){
  const m=ADMIN_METRICS;
  $('#analyticsKpis').innerHTML=[kpi('Total Users',fmt(m.totalUsers),'+'+m.newThisMonth+' new','up','blue'),kpi('Active Today',fmt(m.activeToday),'14% of total','up','emerald'),kpi('Avg Tx Size','$'+fmt(Math.round(m.avgTxSize)),'Per transaction','up','gold'),kpi('30-Day Retention',m.retention.m1+'%','Above benchmark','up','cyan')].join('');
  drawRetention();drawRiskDist();
}
function drawRetention(){const c=$('#retentionChart');if(!c||!c.parentElement.offsetWidth)return;const r=ADMIN_METRICS.retention;drawLineChart(c,[{v:r.m1},{v:r.m3},{v:r.m6},{v:r.m12}],'#60a5fa')}
function drawRiskDist(){const c=$('#riskChart');if(!c||!c.parentElement.offsetWidth)return;const d=ADMIN_METRICS.riskDistribution;
  const{W,H}=sizeCanvas(c);const ctx=c.getContext('2d');ctx.clearRect(0,0,W,H);
  const bars=[{v:d.low,c:'#34d399',l:'Low'},{v:d.medium,c:'#fbbf24',l:'Medium'},{v:d.high,c:'#fb7185',l:'High'}];
  const bw=(W-80)/bars.length-20;
  bars.forEach((b,i)=>{const x=40+i*(bw+20),h=(b.v/100)*(H-60);
    ctx.fillStyle=b.c+'33';ctx.fillRect(x,H-30-h,bw,h);ctx.fillStyle=b.c;ctx.fillRect(x,H-30-h,bw,3);
    ctx.fillStyle='rgba(255,255,255,.6)';ctx.font='bold 10px Inter';ctx.textAlign='center';ctx.fillText(b.l,x+bw/2,H-14);
    ctx.fillStyle=b.c;ctx.font='bold 14px JetBrains Mono';ctx.fillText(b.v+'%',x+bw/2,H-36-h)})}
// ═══════ TICKER ═══════
function initTicker(){const el=$('#tickerBar');if(!el)return;const items=[...STOCKS,...STOCKS].map(s=>`<span class="nx-ticker__item"><span class="nx-ticker__sym">${s.sym}</span>$${s.price.toFixed(2)}<span class="${s.changePct>=0?'nx-ticker__up':'nx-ticker__down'}">${fmtP(s.changePct)}</span></span>`).join('');el.innerHTML=items}
// ═══════ PARTICLES ═══════
function initParticles(){const c=$('#particleCanvas');if(!c)return;const ctx=c.getContext('2d');let ps=[];function resize(){c.width=innerWidth;c.height=innerHeight}resize();window.addEventListener('resize',resize);
  for(let i=0;i<40;i++)ps.push({x:rand(0,c.width),y:rand(0,c.height),r:rand(.5,1.5),vx:rand(-.2,.2),vy:rand(-.2,.2),o:rand(.1,.3)});
  function draw(){ctx.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=c.width;if(p.x>c.width)p.x=0;if(p.y<0)p.y=c.height;if(p.y>c.height)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(96,165,250,${p.o})`;ctx.fill()});requestAnimationFrame(draw)}draw()}
// ═══════ GLOBE ═══════
function initGlobe(){const c=$('#globeCanvas');if(!c)return;
  c.addEventListener('mousedown',e=>{S.globeDrag=true;S.globeLastMouse={x:e.clientX,y:e.clientY}});
  window.addEventListener('mousemove',e=>{if(!S.globeDrag)return;const dx=e.clientX-S.globeLastMouse.x,dy=e.clientY-S.globeLastMouse.y;S.globeRotY+=dx*.005;S.globeRotX=Math.max(-.8,Math.min(.8,S.globeRotX-dy*.005));S.globeLastMouse={x:e.clientX,y:e.clientY}});
  window.addEventListener('mouseup',()=>S.globeDrag=false);
  c.addEventListener('wheel',e=>{e.preventDefault();S.globeZoom=Math.max(.5,Math.min(2,S.globeZoom-e.deltaY*.001))},{passive:false});
  function animate(){if(S.currentPage==='globe'){if(!S.globeDrag)S.globeRotY+=.002;drawGlobe()}requestAnimationFrame(animate)}animate()}
function drawGlobe(){const c=$('#globeCanvas');if(!c||!c.parentElement.offsetWidth)return;const p=c.parentElement;c.width=p.clientWidth-24;const W=c.width,H=c.height,ctx=c.getContext('2d');ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H/2,R=Math.min(W,H)*.38*S.globeZoom,rY=S.globeRotY,rX=S.globeRotX;
  function proj(lat,lng){const la=lat*Math.PI/180,lo=lng*Math.PI/180+rY,x0=Math.cos(la)*Math.sin(lo),y0=Math.sin(la),z0=Math.cos(la)*Math.cos(lo),y1=y0*Math.cos(rX)-z0*Math.sin(rX),z1=y0*Math.sin(rX)+z0*Math.cos(rX);return{x:cx+x0*R,y:cy-y1*R,z:z1}}
  ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fillStyle='rgba(2,6,18,.6)';ctx.fill();ctx.strokeStyle='rgba(96,165,250,.08)';ctx.lineWidth=1;ctx.stroke();
  for(let lat=-80;lat<=80;lat+=20){ctx.beginPath();for(let lng=-180;lng<=180;lng+=5){const{x,y,z}=proj(lat,lng);if(z<-.1)continue;lng===-180||z<0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.strokeStyle='rgba(96,165,250,.04)';ctx.lineWidth=.5;ctx.stroke()}
  CONTINENTS.forEach(cont=>{ctx.beginPath();let started=false;cont.forEach(([lat,lng])=>{const{x,y,z}=proj(lat,lng);if(z<-.1){started=false;return}started?ctx.lineTo(x,y):ctx.moveTo(x,y);started=true});ctx.strokeStyle='rgba(96,165,250,.2)';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='rgba(96,165,250,.04)';ctx.fill()});
  CITIES.forEach(city=>{const{x,y,z}=proj(city.lat,city.lng);if(z<0)return;ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fillStyle='rgba(212,175,55,'+(.4+z*.4)+')';ctx.fill()});
  S.globeArcs.forEach(arc=>{arc.progress+=arc.speed;if(arc.progress>1){arc.from=pick(CITIES);arc.to=pick(CITIES);arc.progress=0}
    const f=proj(arc.from.lat,arc.from.lng),t=proj(arc.to.lat,arc.to.lng);if(f.z<0&&t.z<0)return;
    const mx=(f.x+t.x)/2,my=(f.y+t.y)/2-40*S.globeZoom;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.quadraticCurveTo(mx,my,f.x+(t.x-f.x)*arc.progress,f.y+(t.y-f.y)*arc.progress);ctx.strokeStyle='rgba(212,175,55,.3)';ctx.lineWidth=1;ctx.stroke()})}
// ═══════ THEME ═══════
function initTheme(){const btn=$('#themeToggle');if(!btn)return;const saved=localStorage.getItem('nx_theme');if(saved){S.theme=saved;document.documentElement.setAttribute('data-theme',saved);btn.textContent=saved==='light'?'☀':'☽'}
  btn.onclick=()=>{S.theme=S.theme==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',S.theme);btn.textContent=S.theme==='light'?'☀':'☽';localStorage.setItem('nx_theme',S.theme);toast('Theme: '+S.theme,'info')}}
// ═══════ CMD PALETTE ═══════
function initCmdPalette(){const ov=$('#cmdOverlay'),inp=$('#cmdInput'),res=$('#cmdResults');
  const open=()=>{ov.classList.add('open');inp.value='';inp.focus();renderCmdResults('')};
  const close=()=>{ov.classList.remove('open')};
  $('#cmdHint').onclick=open;
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();ov.classList.contains('open')?close():open()}if(e.key==='Escape')close()});
  ov.addEventListener('click',e=>{if(e.target===ov)close()});
  inp.addEventListener('input',()=>renderCmdResults(inp.value));
  function renderCmdResults(q){const filtered=CMD_ACTIONS.filter(a=>a.label.toLowerCase().includes(q.toLowerCase()));
    res.innerHTML=filtered.map(a=>`<div class="nx-cmd-item" data-action="${a.action}" data-tag="${a.tag}"><span class="nx-cmd-item__icon">◈</span><span class="nx-cmd-item__label">${a.label}</span></div>`).join('');
    res.querySelectorAll('.nx-cmd-item').forEach(el=>{el.onclick=()=>{const act=el.dataset.action;
      if(el.dataset.tag==='page')navigateTo(act);
      else if(act==='notifs'){$('#notifDrawer').classList.add('open')}
      else if(act==='toggle-theme'){$('#themeToggle').click()}
      else if(act==='send-money')navigateTo('transfers');
      else if(act==='analytics')navigateTo(S.isAdmin?'admin_analytics':'portfolio');
      close()}})}renderCmdResults('')}
// ═══════ NOTIFICATIONS ═══════
function initNotifDrawer(){$('#notifBtn').onclick=()=>$('#notifDrawer').classList.toggle('open');$('#notifClose').onclick=()=>$('#notifDrawer').classList.remove('open');
  $('#notifList').innerHTML=NOTIFS.map(n=>`<div class="nx-notif-item"><div class="nx-notif-item__header"><span class="nx-notif-item__dot ${n.pri}"></span><span class="nx-notif-item__title">${n.title}</span><span class="nx-notif-item__time">${n.time}</span></div><div class="nx-notif-item__body">${n.body}</div></div>`).join('')}
// ═══════ TOGGLE COMPONENT ═══════
// CSS toggle is handled via class
// ═══════ SIMULATION ═══════
function startSim(){
  setInterval(()=>{CURRENCIES.forEach(c=>{c.rate+=rand(-.05,.05)*(c.rate>10?1:.001);c.change=rand(-.1,.1)*(c.rate>10?1:.01);c.hist.push(c.rate);if(c.hist.length>30)c.hist.shift()});if(S.currentPage==='dashboard'){renderCurrencyCards()}if(S.currentPage==='globe')renderCurrencyGrid()},4000);
  setInterval(()=>{S.accounts.forEach(a=>a.bal+=rand(-5e3,1e4));if(S.currentPage==='dashboard')renderDashboard()},8000);
  setInterval(()=>{STOCKS.forEach(s=>{const d=rand(-2,2);s.price=Math.max(10,s.price+d);s.change=d;s.changePct=d/s.price*100;s.hist.push(s.price);if(s.hist.length>60)s.hist.shift()});INDICES.forEach(idx=>{idx.v+=rand(-20,20);idx.c=rand(-.5,1.5)});if(S.currentPage==='markets'){renderStockList();drawStockChart()}},3000);
  setInterval(()=>{S.txH.push({id:uid(),from:pick(CITIES).n,to:pick(CITIES).n,amt:rand(5e4,2e7),cur:pick(CURS),time:utc()});if(S.txH.length>50)S.txH.shift();if(S.currentPage==='globe')renderGlobeFeed()},5000);
  setInterval(()=>{const msgs=[['Portfolio growing steadily','success'],['Security check passed','success'],['Market trends updated','info'],['New insight available','info']];const[m,t]=pick(msgs);toast(m,t)},30000);
}
document.addEventListener('DOMContentLoaded',init);
