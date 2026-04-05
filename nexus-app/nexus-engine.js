/* ═══════════════════════════════════════════════════════
   NEXUS ENGINE — Clean Intelligence Runtime
   ═══════════════════════════════════════════════════════ */
'use strict';

const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const rand=(a,b)=>Math.random()*(b-a)+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const fmt=n=>n.toLocaleString('en-US');
const fmtK=n=>n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toFixed(0);

// ── Particles ──
(function(){
  const c=$('#nxParticles'),ctx=c.getContext('2d');let W,H,pts=[];
  function resize(){W=c.width=innerWidth;H=c.height=innerHeight}
  addEventListener('resize',resize);resize();
  for(let i=0;i<40;i++)pts.push({x:rand(0,W),y:rand(0,H),r:rand(.2,.8),vx:rand(-.06,.06),vy:rand(-.04,.04),a:rand(.08,.25)});
  function draw(){
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(124,58,237,${p.a})`;ctx.fill();
    });
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<160){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);
        ctx.strokeStyle=`rgba(124,58,237,${.02*(1-d/160)})`;ctx.lineWidth=.5;ctx.stroke();}
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── Navigation ──
(function(){
  const btns=$$('.nx-nav__item');
  btns.forEach(b=>b.addEventListener('click',()=>{
    btns.forEach(x=>x.classList.remove('active'));b.classList.add('active');
    $$('.nx-page').forEach(p=>p.classList.remove('active'));
    const t=$('#page-'+b.dataset.page);if(t)t.classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  }));
})();

// ── Stock Data ──
const STOCKS=[
  {s:'AAPL',n:'Apple Inc.',p:189.42},{s:'MSFT',n:'Microsoft',p:428.73},
  {s:'GOOGL',n:'Alphabet',p:176.82},{s:'AMZN',n:'Amazon',p:201.34},
  {s:'NVDA',n:'NVIDIA',p:924.56},{s:'TSLA',n:'Tesla',p:248.91},
  {s:'META',n:'Meta',p:534.21},{s:'JPM',n:'JPMorgan',p:198.62},
  {s:'V',n:'Visa',p:287.44},{s:'NFLX',n:'Netflix',p:688.12}
];
const history={};
STOCKS.forEach(st=>{history[st.s]=[];let v=st.p;for(let i=0;i<80;i++){v+=rand(-v*.004,v*.005);history[st.s].push(v)}});
function tickStocks(){STOCKS.forEach(st=>{st.p+=rand(-st.p*.003,st.p*.004);history[st.s].push(st.p);if(history[st.s].length>120)history[st.s].shift()})}
setInterval(tickStocks,2500);

// ── Chart ──
function drawChart(canvasId,data,color='#7c3aed'){
  const c=$('#'+canvasId);if(!c)return;const ctx=c.getContext('2d');
  const W=c.width,H=c.height,pad=40;
  ctx.clearRect(0,0,W,H);
  for(let i=0;i<5;i++){const y=pad+(H-pad*2)/4*i;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(W-pad,y);ctx.strokeStyle='rgba(255,255,255,.03)';ctx.lineWidth=1;ctx.stroke()}
  const len=data.length;if(!len)return;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  const stepX=(W-pad*2)/(len-1),scaleY=(H-pad*2)/range;
  const grad=ctx.createLinearGradient(0,pad,0,H-pad);
  grad.addColorStop(0,color.replace(')',',0.1)').replace('rgb','rgba'));grad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.beginPath();ctx.moveTo(pad,H-pad-(data[0]-min)*scaleY);
  for(let i=1;i<len;i++)ctx.lineTo(pad+i*stepX,H-pad-(data[i]-min)*scaleY);
  ctx.lineTo(pad+(len-1)*stepX,H-pad);ctx.lineTo(pad,H-pad);ctx.closePath();
  ctx.fillStyle=grad;ctx.fill();
  ctx.beginPath();ctx.moveTo(pad,H-pad-(data[0]-min)*scaleY);
  for(let i=1;i<len;i++)ctx.lineTo(pad+i*stepX,H-pad-(data[i]-min)*scaleY);
  ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.stroke();
  ctx.shadowColor=color;ctx.shadowBlur=12;ctx.stroke();ctx.shadowBlur=0;
  const lastY=H-pad-(data[len-1]-min)*scaleY,lastX=pad+(len-1)*stepX;
  ctx.beginPath();ctx.arc(lastX,lastY,5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  ctx.beginPath();ctx.arc(lastX,lastY,10,0,Math.PI*2);ctx.strokeStyle=color;ctx.globalAlpha=.25;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1;
}

// ── Ticker ──
function updateTicker(){
  const t=$('#nxTicker');if(!t)return;
  t.innerHTML=STOCKS.slice(0,6).map(st=>{const ch=rand(-2,2);return`<span style="margin-right:16px;color:${ch>=0?'var(--green)':'var(--red)'}"><strong>${st.s}</strong> $${st.p.toFixed(2)} ${ch>=0?'+':''}${ch.toFixed(2)}%</span>`}).join('');
}

// ── Toast ──
function nxToast(msg,type='info'){
  const box=$('#nxToasts'),el=document.createElement('div');
  el.className='nx-toast '+type;el.textContent=msg;box.appendChild(el);
  setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),300)},5000);
}

// ═══════════════════════════════════════════════════════
// PAGE RENDERERS
// ═══════════════════════════════════════════════════════

// ── HOME ──
function renderHome(){
  const hour=new Date().getHours();
  const greeting=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
  const wt=$('.nx-welcome__title');if(wt)wt.innerHTML=`${greeting}, <span class="nx-gradient-text">Syed</span> 👋`;

  const pv=rand(520000,680000),pl=rand(-3000,5000),mr=rand(-.5,1.2);
  $('#nxDailySummary').textContent=`Markets are ${mr>=0?'up':'down'} ${Math.abs(mr).toFixed(1)}% today. Your portfolio ${pl>=0?'gained':'lost'} $${Math.abs(Math.round(pl)).toLocaleString()}. ${pick(['NVDA is showing a breakout pattern','AAPL hit a new support level','Tech sector is outperforming'])} — ${pick(['consider reviewing positions','AI recommends holding','no major risks detected'])}.`;

  const cards=$('#homeCards');if(cards){
    cards.innerHTML=[
      {l:'Portfolio Value',v:'$'+fmtK(pv),d:rand(.5,4),icon:'💰',c:'up'},
      {l:'Today\'s P&L',v:(pl>=0?'+':'-')+'$'+Math.abs(Math.round(pl)).toLocaleString(),d:pl>=0?rand(.2,3):rand(-3,-.5),icon:'📈',c:pl>=0?'up':'down'},
      {l:'Active Alerts',v:Math.round(rand(2,7)),d:rand(-4,2),icon:'🔔',c:'up'},
      {l:'AI Confidence',v:rand(88,96).toFixed(0)+'%',d:rand(.2,2),icon:'🧠',c:'up'}
    ].map(k=>`<div class="nx-card nx-stat-card" style="animation:float ${rand(5,8).toFixed(1)}s ease-in-out infinite"><span class="nx-stat-card__icon">${k.icon}</span><div class="nx-stat-card__label">${k.l}</div><div class="nx-stat-card__value">${k.v}</div><div class="nx-stat-card__delta ${k.c}">${k.d>=0?'▲ +':'▼ '}${Math.abs(k.d).toFixed(1)}%</div></div>`).join('');
  }

  const d=[];let v=100000;for(let i=0;i<60;i++){v+=rand(-800,1100);d.push(v)}
  drawChart('homeChart',d,'#7c3aed');
}

// ── MARKETS ──
function renderMarkets(){
  drawChart('mktChart',history['AAPL'],'#22d3ee');

  const wl=$('#nxWatchlist');if(wl){
    wl.innerHTML=STOCKS.slice(0,6).map(st=>{
      const ch=((st.p-history[st.s][0])/history[st.s][0]*100);
      return`<div class="nx-stock-row"><div class="nx-stock-dot ${ch>=0?'up':'down'}"></div><span class="nx-stock-sym">${st.s}</span><span class="nx-stock-name">${st.n}</span><span class="nx-stock-price">$${st.p.toFixed(2)}</span><span class="nx-stock-chg" style="background:${ch>=0?'var(--green-l)':'var(--red-l)'};color:${ch>=0?'var(--green)':'var(--red)'}">${ch>=0?'+':''}${ch.toFixed(2)}%</span></div>`;
    }).join('');
  }

  const mv=$('#nxMovers');if(mv){
    const sorted=[...STOCKS].map(st=>({...st,ch:rand(-4,5)})).sort((a,b)=>Math.abs(b.ch)-Math.abs(a.ch)).slice(0,5);
    mv.innerHTML=sorted.map(st=>`<div class="nx-stock-row"><div class="nx-stock-dot ${st.ch>=0?'up':'down'}"></div><span class="nx-stock-sym">${st.s}</span><span class="nx-stock-name">${st.n}</span><span class="nx-stock-price">$${st.p.toFixed(2)}</span><span class="nx-stock-chg" style="background:${st.ch>=0?'var(--green-l)':'var(--red-l)'};color:${st.ch>=0?'var(--green)':'var(--red)'}">${st.ch>=0?'+':''}${st.ch.toFixed(2)}%</span></div>`).join('');
  }
}

// ── INSIGHTS ──
function renderInsights(){
  const ig=$('#nxInsights');if(ig){
    ig.innerHTML=[
      {type:'buy',sym:'NVDA',t:'Breakout Detected',d:'NVDA is breaking above its 200-day moving average with strong volume. AI confidence: 91%.','act':'View Analysis →'},
      {type:'hold',sym:'AAPL',t:'Consolidation Phase',d:'Apple is trading in a tight range near support. Wait for directional confirmation before acting.','act':'Set Alert →'},
      {type:'sell',sym:'TSLA',t:'Overbought Signal',d:'RSI reached 78 — historically this leads to a 3-5% pullback within 5 days.','act':'Review Position →'},
      {type:'info',sym:'PORTFOLIO',t:'Rebalance Suggestion',d:'Your tech allocation is 68% — consider diversifying into healthcare and energy sectors.','act':'Auto-Optimize →'}
    ].map(c=>`<div class="nx-insight-card"><div class="nx-insight-card__type ${c.type}">● ${c.type.toUpperCase()} · ${c.sym}</div><div class="nx-insight-card__title">${c.t}</div><div class="nx-insight-card__desc">${c.d}</div><div class="nx-insight-card__action">${c.act}</div></div>`).join('');
  }

  const sg=$('#nxSentiment');if(sg){
    sg.innerHTML=[
      {n:'Technology',s:72,l:'Bullish',c:'var(--green)'},
      {n:'Finance',s:55,l:'Neutral',c:'var(--amber)'},
      {n:'Healthcare',s:68,l:'Bullish',c:'var(--green)'},
      {n:'Energy',s:41,l:'Bearish',c:'var(--red)'},
      {n:'Consumer',s:63,l:'Neutral',c:'var(--amber)'},
      {n:'Real Estate',s:38,l:'Bearish',c:'var(--red)'}
    ].map(s=>`<div class="nx-sentiment-item"><div class="nx-sentiment-item__name">${s.n}</div><div class="nx-sentiment-item__score" style="color:${s.c}">${s.s}</div><div class="nx-sentiment-item__label" style="color:${s.c}">${s.l}</div></div>`).join('');
  }

  const rd=$('#nxRiskDetails');if(rd){
    rd.innerHTML=[
      {l:'Portfolio VaR (95%)',v:'$12,450'},{l:'Max Drawdown',v:'8.2%'},
      {l:'Beta',v:'1.12'},{l:'Correlation Risk',v:'Low'},
      {l:'Concentration',v:'68% Tech'}
    ].map(r=>`<div class="nx-risk-row"><span class="nx-risk-row__label">${r.l}</span><span class="nx-risk-row__value">${r.v}</span></div>`).join('');
  }
}

// ── ASSISTANT ──
function initAssistant(){
  const chat=$('#nxChat'),input=$('#nxInput'),send=$('#nxSend');
  if(!chat)return;
  chat.innerHTML='<div class="nx-chat-msg bot">Hi <strong>Syed</strong> 👋 I\'m your <strong>NEXUS AI</strong> assistant. Ask me anything about your finances, markets, or portfolio. I\'ll explain things simply and suggest actions you can take.</div>';

  const responses=[
    {q:'market',a:'<strong>Markets today:</strong> The overall market is slightly bullish. NIFTY is up 0.8%, led by technology and energy sectors. Key levels to watch: Support at 22,300, Resistance at 22,700. I\'d suggest <strong>holding current positions</strong>.'},
    {q:'portfolio',a:'<strong>Your portfolio:</strong> Total value is $627K, up 2.4% this month. Your strongest performer is NVDA (+18%). Suggestion: Your tech allocation (68%) is high — consider adding 5% to healthcare for better diversification.'},
    {q:'buy',a:'Based on current signals, here are my top picks:<br>• <strong>NVDA</strong> — Breakout above 200DMA (BUY, target $980)<br>• <strong>MSFT</strong> — Golden cross forming (BUY, target $445)<br>Always set stop-losses 5% below entry.'},
    {q:'risk',a:'<strong>Risk check:</strong> Your risk score is 23/100 (Low). VaR at 95% confidence: $12,450. No unusual volatility detected. Your portfolio is well within safe parameters. ✅'},
    {q:'crypto',a:'<strong>Crypto overview:</strong> BTC is forming a cup-and-handle at $69K — typically bullish. ETH showing strength against BTC. DeFi TVL up 12% this week. Consider small BTC allocation if not already exposed.'},
    {q:'explain',a:'Of course! I can explain any chart, metric, or financial concept in simple terms. Just tell me what you\'re looking at and I\'ll break it down step by step. 📚'},
    {q:'optimize',a:'<strong>Portfolio optimization:</strong> I recommend:<br>• Reduce TSLA by 5% (overbought)<br>• Increase MSFT by 3% (strong momentum)<br>• Add 2% Gold ETF (hedge)<br>Expected improvement: +0.12 Sharpe ratio. Shall I apply this?'},
    {q:'help',a:'Here\'s what I can help with:<br>• 📊 <strong>Market analysis</strong> — trends, signals, predictions<br>• 💼 <strong>Portfolio review</strong> — P&L, allocation, optimization<br>• ⚠️ <strong>Risk assessment</strong> — VaR, drawdown, correlations<br>• 💡 <strong>Explanations</strong> — any concept, simply<br>Just ask naturally!'}
  ];

  function handleSend(){
    const q=input.value.trim();if(!q)return;
    chat.innerHTML+=`<div class="nx-chat-msg user">${q}</div>`;input.value='';
    const match=responses.find(r=>q.toLowerCase().includes(r.q))||pick(responses);
    setTimeout(()=>{
      chat.innerHTML+=`<div class="nx-chat-msg bot">${match.a}</div>`;
      chat.scrollTop=chat.scrollHeight;
    },600);
    chat.scrollTop=chat.scrollHeight;
  }
  send.addEventListener('click',handleSend);
  input.addEventListener('keydown',e=>{if(e.key==='Enter')handleSend()});
}

// ── PROFILE ──
function renderProfile(){
  const prefs=$('#nxPrefs');if(prefs){
    prefs.innerHTML=[
      {l:'Dark Mode',toggle:true,on:true},{l:'Push Notifications',toggle:true,on:true},
      {l:'AI Suggestions',toggle:true,on:true},{l:'Sound Effects',toggle:true,on:false},
      {l:'Language',v:'English (US)'},{l:'Currency',v:'USD ($)'}
    ].map(p=>p.toggle?
      `<div class="nx-pref-row"><span class="nx-pref-row__label">${p.l}</span><button class="nx-tog ${p.on?'on':'off'}" onclick="this.classList.toggle('on');this.classList.toggle('off')"></button></div>`:
      `<div class="nx-pref-row"><span class="nx-pref-row__label">${p.l}</span><span class="nx-pref-row__value">${p.v}</span></div>`
    ).join('');
  }
  const sec=$('#nxSecurity');if(sec){
    sec.innerHTML=[
      {l:'Two-Factor Auth',v:'✅ Enabled'},{l:'Login Sessions',v:'2 Active'},
      {l:'Last Login',v:'Today, 9:14 PM'},{l:'Data Encryption',v:'AES-256'},
      {l:'Password',v:'Changed 14 days ago'}
    ].map(s=>`<div class="nx-pref-row"><span class="nx-pref-row__label">${s.l}</span><span class="nx-pref-row__value">${s.v}</span></div>`).join('');
  }
}

// ── AI AGENT ──
function initAgent(){
  const fab=$('#nxAgentFab'),agent=$('#nxAgent'),msg=$('#nxAgentMsg');
  const tips=[
    'Your portfolio dropped 1.2% today — want to see why?',
    'NVDA is trending upward — should I analyze it for you?',
    'You can improve your portfolio balance — tap to optimize.',
    'Markets just opened — here\'s your morning briefing.',
    'A stock in your watchlist hit your price target!',
    'Great news! Your portfolio is up 3.2% this week. 🎉'
  ];
  fab.addEventListener('click',()=>agent.classList.toggle('open'));
  let tipIdx=0;
  setInterval(()=>{
    msg.textContent=tips[tipIdx%tips.length];tipIdx++;
  },12000);
  setTimeout(()=>agent.classList.add('open'),4000);
  setTimeout(()=>agent.classList.remove('open'),12000);
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  renderHome();renderMarkets();renderInsights();
  initAssistant();renderProfile();initAgent();
  updateTicker();setInterval(updateTicker,5000);

  setInterval(()=>{
    renderHome();renderMarkets();
  },5000);

  nxToast('NEXUS initialized — All systems running smoothly','success');
  setTimeout(()=>nxToast('AI models loaded — Ready to assist','info'),3000);

  // TF button handlers
  $$('.nx-tf-group').forEach(g=>{
    g.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
      g.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    }));
  });
});
