/* 設計小課堂：讀取 data.json（由 _data 資料夾產生），用網址 # 切換頁面 */
(function(){
'use strict';

const PALETTE={
  green:['#1E6B52','#8ED3B6','#F2C14E'],
  blue:['#2B3A67','#AFC2F0','#F2C14E'],
  red:['#8A3B2E','#F2B8A8','#F2C14E'],
  purple:['#5B3A7A','#D3B8F0','#F2C14E'],
  gray:['#3A4540','#C5CFCA','#F2C14E']
};
const PATTERNS=['grid','lines','dots','blocks'];

let SITE={},TOPICS=[],QAS=[],NOTES=[];

/* ---------- 小工具 ---------- */
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v.filter(x=>x!==null&&x!==''):[];
const fileUrl=p=>!p?'':/^(https?:)?\/\//.test(p)?p:String(p).replace(/^\/+/,'');
const keyOf=v=>String(v??'').replace(/^.*\//,'').replace(/\.(json|ya?ml)$/,'');
const T=id=>TOPICS.find(t=>t.id===keyOf(id));
const toSec=s=>{const p=String(s||'0').split(':').map(Number);return p.reduce((a,n)=>a*60+(n||0),0)};
const fmtTotal=n=>{const m=Math.round(n/60);return m>=60?`${Math.floor(m/60)} 小時 ${m%60} 分`:`${m} 分鐘`};
const total=t=>fmtTotal(t.chapters.reduce((a,c)=>a+toSec(c.duration),0));
const dateStr=d=>d?String(d).slice(0,10):'';
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
let done=new Set(store('cs-done')||[]);
function markDone(k){done.add(k);store('cs-done',[...done]);store('cs-last',k)}
const pct=t=>t.chapters.length?Math.round(t.chapters.filter((_,i)=>done.has(`${t.id}-${i+1}`)).length/t.chapters.length*100):0;
const isDesk=()=>matchMedia('(min-width:1001px)').matches;
const sideClosed=()=>isDesk()?store('cs-side')==='closed':true;
const ext=(label,url,cls='btn')=>url?`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`:'';

function ytId(u){
  if(!u)return '';u=String(u).trim();
  if(/^[\w-]{11}$/.test(u))return u;
  const m=u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m?m[1]:'';
}

/* ---------- 配圖 ---------- */
function patternSvg(t,w,h){
  const [a,b,c]=PALETTE[t.color]||PALETTE.green;const pat=PATTERNS[t._idx%4];let s='';
  if(pat==='grid'){for(let x=0;x<8;x++)for(let y=0;y<5;y++)s+=`<rect x="${20+x*38}" y="${16+y*32}" width="26" height="20" rx="3" fill="${(x+y)%5===0?c:b}" opacity="${(x*y)%3?0.35:0.9}"/>`}
  if(pat==='lines'){for(let i=0;i<9;i++)s+=`<rect x="28" y="${22+i*16}" width="${120+((i*53)%150)}" height="${i===1?12:6}" rx="3" fill="${i===1?c:b}" opacity="${i===1?1:0.55}"/>`}
  if(pat==='dots'){for(let i=0;i<6;i++)s+=`<circle cx="${60+i*42}" cy="${90+Math.sin(i)*30}" r="${18+i*3}" fill="${i===3?c:b}" opacity="${0.4+i*0.1}"/>`}
  if(pat==='blocks'){s+=`<rect x="30" y="30" width="110" height="120" rx="6" fill="${b}" opacity=".85"/><rect x="152" y="30" width="138" height="56" rx="6" fill="${b}" opacity=".5"/><rect x="152" y="94" width="64" height="56" rx="6" fill="${c}"/><rect x="226" y="94" width="64" height="56" rx="6" fill="${b}" opacity=".35"/>`}
  return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"><rect width="320" height="180" fill="${a}"/>${s}</svg>`;
}
function cover(t){
  const inner=t.cover?`<img src="${esc(fileUrl(t.cover))}" alt="" loading="lazy">`:patternSvg(t);
  return `<div class="cover" role="img" aria-label="${esc(t.title)} 主題配圖">${inner}</div>`;
}
function avatar(t){
  if(t.cover)return `<img src="${esc(fileUrl(t.cover))}" alt="" style="width:100%;height:100%;object-fit:cover">`;
  const [a,,c]=PALETTE[t.color]||PALETTE.green;
  return `<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="${a}"/><text x="20" y="26.5" text-anchor="middle" font-size="17" font-weight="900" fill="${c}" font-family="Noto Sans TC,sans-serif">${esc([...t.title][0]||'')}</text></svg>`;
}
function thumb(t,i,ch){
  const id=ytId(ch.youtube);
  if(id)return `<img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy">`;
  const [a,b,c]=PALETTE[t.color]||PALETTE.green;
  return `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice"><rect width="160" height="90" fill="${a}"/><rect x="96" y="14" width="48" height="62" rx="4" fill="${b}" opacity=".35"/><rect x="104" y="24" width="32" height="6" rx="3" fill="${b}" opacity=".8"/><rect x="104" y="36" width="22" height="6" rx="3" fill="${b}" opacity=".6"/><text x="14" y="62" font-size="40" font-weight="500" fill="${c}" font-family="IBM Plex Mono,monospace">${String(i).padStart(2,'0')}</text></svg>`;
}

/* ---------- 共用區塊 ---------- */
function topicCard(t){
  const p=pct(t);
  return `<a class="card" href="#t-${t.id}">${cover(t)}<div class="card-body">
    <div class="meta">${t.category?`<span class="tag">${esc(t.category)}</span>`:''}${t.level?`<span>${esc(t.level)}</span>`:''}</div>
    <h3>${esc(t.title)}</h3>
    <div class="meta mono"><span>${t.chapters.length} 章</span><span>${total(t)}</span>${t.updated?`<span>更新 ${esc(dateStr(t.updated))}</span>`:''}</div>
    ${p?`<div class="prog" aria-label="已看 ${p}%"><i style="width:${p}%"></i></div>`:''}
  </div></a>`;
}
function askBox(title,body){
  const links=arr(SITE.ask&&SITE.ask.links).map(l=>ext(l.label,l.url)).join('');
  if(!links)return '';
  return `<div class="box ask"><h3>${esc(title)}</h3><p class="muted" style="margin-top:6px">${esc(body)}</p><div class="links">${links}</div></div>`;
}
const crumb=items=>`<div class="crumb"><a href="#home">首頁</a>${items.map(([l,h])=>`/${h?`<a href="${h}">${esc(l)}</a>`:`<span>${esc(l)}</span>`}`).join('')}</div>`;
const supportUrl=()=>SITE.support&&SITE.support.url;

/* ---------- 頁面 ---------- */
const pages={
 home(){
  const last=store('cs-last');let resume='';
  if(last){const [tid,n]=last.split('-');const t=T(tid);const c=t&&t.chapters[n-1];
    if(c)resume=`<div class="resume"><div class="grow"><div class="muted" style="font-size:13px">上次看到</div><b>${esc(t.title)}・第 ${n} 章 ${esc(c.title)}</b></div><a class="btn primary" href="#c-${last}">繼續看</a></div>`}
  const newest=[...TOPICS].sort((a,b)=>dateStr(b.updated).localeCompare(dateStr(a.updated)))[0];
  const chCount=TOPICS.reduce((a,t)=>a+t.chapters.length,0);
  const news=arr(SITE.news);
  return `
  <section class="hero">
   <div><h1>${esc(SITE.hero_title||SITE.name)}</h1>
    ${SITE.hero_lead?`<p class="lead">${esc(SITE.hero_lead)}</p>`:''}
    <div class="acts"><a class="btn primary" href="#topics">看所有主題</a><a class="btn" href="#qa">第一次來？看常見問題</a></div></div>
   <div class="board" aria-hidden="true">
    ${newest?`<div class="ln"><span>新</span><span>${esc(newest.title)} <b>${newest.chapters.length} 章</b></span></div>`:''}
    <div class="ln"><span>共</span><span>${TOPICS.length} 個主題・<b>${chCount} 章</b></span></div>
    ${SITE.coming_soon?`<div class="ln"><span>&gt;</span><span>${esc(SITE.coming_soon)}_</span></div>`:''}
   </div>
  </section>
  ${resume}
  <section class="sec">
   <div class="sec-head"><h2>主題</h2><a href="#topics">看全部</a></div>
   ${TOPICS.length?`<div class="grid">${TOPICS.map(topicCard).join('')}</div>`:`<div class="empty">第一個主題準備中</div>`}
  </section>
  <section class="sec two">
   ${news.length?`<div class="box"><h3>最新消息</h3><ul class="muted">${news.map(n=>`<li><span class="mono">${esc(dateStr(n.date).slice(5).replace('-','/'))}</span> ${esc(n.text)}</li>`).join('')}</ul></div>`:''}
   <div class="box"><h3>關於我</h3><p class="muted" style="margin-top:8px">${esc((SITE.about&&SITE.about.short)||'')}</p><a class="btn" style="margin-top:14px" href="#about">認識我</a></div>
  </section>
  ${supportUrl()?`<section class="sec box" style="background:var(--chalk-soft);border-color:transparent;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap">
   <div><h3>覺得有幫助的話</h3><p class="muted">${esc(SITE.support.short||'')}</p></div><a class="btn chalk" href="#support">支持我</a></section>`:''}`;
 },

 topics(){
  const cats=['全部',...new Set(TOPICS.map(t=>t.category).filter(Boolean))];
  return `${crumb([['所有主題']])}
  <h1>所有主題</h1><p class="muted" style="margin-top:8px">共 ${TOPICS.length} 個主題、${TOPICS.reduce((a,t)=>a+t.chapters.length,0)} 章</p>
  ${cats.length>2?`<div class="chips" style="margin-top:24px" id="catChips">${cats.map((c,i)=>`<button class="chip" aria-pressed="${i===0}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>`:''}
  <div class="grid" style="margin-top:20px" id="topicGrid">${TOPICS.map(topicCard).join('')||'<div class="empty">第一個主題準備中</div>'}</div>`;
 },

 chapter(id,n,mark=true){
  const t=T(id);n=+n;if(!t)return pages.notfound();
  if(!t.chapters.length)return `${crumb([['所有主題','#topics'],[t.title]])}<h1>${esc(t.title)}</h1><div class="empty" style="margin-top:24px">這個主題的影片準備中</div>`;
  const c=t.chapters[n-1];if(!c)return pages.notfound();
  const k=`${id}-${n}`;if(mark)markDone(k);const p=pct(t);
  const vid=ytId(c.youtube);
  const stamps=arr(c.timestamps).filter(s=>s.time);
  const rq=QAS.filter(q=>keyOf(q.topic)===id&&+q.chapter===n);
  const closed=sideClosed();
  const prev=n>1?`<a class="pill" href="#c-${id}-${n-1}">← 上一章</a>`:'';
  const nxt=n<t.chapters.length?`<a class="pill primary" href="#c-${id}-${n+1}">下一章 →</a>`:`<a class="pill primary" href="#topics">看其他主題</a>`;
  const handout=c.handout?`<a class="pill" href="${esc(fileUrl(c.handout))}" target="_blank" rel="noopener" download>下載講義</a>`:'';
  const related=TOPICS.filter(x=>x.id!==id).slice(0,3);
  document.title=`${c.title}｜${t.title}｜${SITE.name}`;
  return `<div class="lesson${closed?' closed':''}" id="lesson">
   <div class="l-player">
    <div class="player" id="player">${vid?`<iframe id="yt" src="https://www.youtube-nocookie.com/embed/${vid}?rel=0" title="${esc(c.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      :`<div><div class="play" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M7 4v16l13-8z" fill="#3B2C00"/></svg></div>影片準備中<br><small>第 ${n} 章</small></div>`}</div>
   </div>
   <div class="l-info">
    <h1>${esc(c.title)}</h1>
    <div class="chan">
     <span class="chan-av" aria-hidden="true">${avatar(t)}</span>
     <div><span class="name">${esc(t.title)}</span><div class="ep-m">${[t.category,t.level,`共 ${t.chapters.length} 章`,p?`已看 ${p}%`:''].filter(Boolean).map(esc).join('・')}</div></div>
     <div class="acts">${prev}${nxt}${handout}<button class="pill" data-share>分享</button></div>
    </div>
   </div>
   <aside class="side l-side">
    <button class="side-head" id="sideToggle" aria-expanded="${!closed}" aria-controls="sideList">
     <span class="side-txt"><span class="side-title">章節清單</span><span class="side-count mono">${n} / ${t.chapters.length}</span>
     <span class="side-next">${n<t.chapters.length?'下一章：'+esc(t.chapters[n].title):'這是最後一章'}</span></span>
     <svg class="chev" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <ol id="sideList">${t.chapters.map((x,i)=>{const kk=`${id}-${i+1}`,cur=i+1===n,seen=done.has(kk)&&!cur;
      return `<li><a class="ep${cur?' cur':''}" href="#c-${kk}"${cur?' aria-current="page"':''}><span class="idx">${cur?'▶':i+1}</span><span class="thumb">${thumb(t,i+1,x)}${x.duration?`<span class="dur mono">${esc(x.duration)}</span>`:''}${seen?'<span class="seen"></span>':''}</span><span style="min-width:0"><span class="ep-t">${esc(x.title)}</span><span class="ep-m">${seen?'看過了':'第 '+(i+1)+' 章'}</span></span></a></li>`}).join('')}</ol>
   </aside>
   <div class="l-main stack" style="gap:28px">
    ${arr(c.points).length||stamps.length?`<div class="desc">
     <div class="meta"><span class="mono">第 ${n} / ${t.chapters.length} 章</span>${c.duration?`<span class="mono">${esc(c.duration)}</span>`:''}</div>
     ${arr(c.points).length?`<ul>${arr(c.points).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
     ${stamps.length?`<div class="stamps">${stamps.map(s=>`<button data-stamp="${toSec(s.time)}"><span class="mono">${esc(s.time)}</span><span>${esc(s.label)}</span></button>`).join('')}</div>`:''}
    </div>`:''}
    <section class="box">
     <div class="meta">${t.category?`<span class="tag">${esc(t.category)}</span>`:''}${t.level?`<span>${esc(t.level)}</span>`:''}${arr(t.tags).map(g=>`<span>#${esc(g)}</span>`).join('')}</div>
     <h2 style="margin-top:8px">關於「${esc(t.title)}」</h2>
     ${t.description?`<p class="muted" style="margin-top:6px;white-space:pre-line">${esc(t.description)}</p>`:''}
     <div class="meta mono" style="margin-top:10px"><span>${t.chapters.length} 章</span><span>${total(t)}</span>${t.updated?`<span>更新 ${esc(dateStr(t.updated))}</span>`:''}</div>
     ${arr(t.goals).length||arr(t.audience).length?`<div class="two" style="margin-top:16px">
      ${arr(t.goals).length?`<div><h3>看完你會</h3><ul class="muted">${arr(t.goals).map(g=>`<li>${esc(g)}</li>`).join('')}</ul></div>`:''}
      ${arr(t.audience).length?`<div><h3>適合誰</h3><ul class="muted">${arr(t.audience).map(g=>`<li>${esc(g)}</li>`).join('')}</ul></div>`:''}
     </div>`:''}
    </section>
    ${rq.length?`<div><h3 style="margin-bottom:10px">這章的常見問題</h3>${rq.map(q=>`<details class="qa"><summary>${esc(q.question)}</summary><div class="a" style="white-space:pre-line">${esc(q.answer)}</div></details>`).join('')}</div>`:''}
    <div class="end-box">${askBox('這章有問題？','網站不開放留言，有問題歡迎用這些管道問我。常被問到的會整理到常見問題。')}
     ${supportUrl()?`<div class="box tip"><h3>喜歡這堂課？</h3><p class="muted" style="margin-top:6px">${esc(SITE.support.short||'')}</p><a class="btn chalk" style="margin-top:12px" href="#support">支持我</a></div>`:''}
    </div>
    ${related.length?`<section><h2 style="margin-bottom:14px">你可能也會想看</h2><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">${related.map(topicCard).join('')}</div></section>`:''}
   </div>
  </div>`;
 },

 qa(){
  const item=q=>{const t=T(q.topic);const link=t&&q.chapter&&t.chapters[q.chapter-1]?` <a href="#c-${t.id}-${q.chapter}" style="color:var(--accent)">看 ${esc(t.title)} 第 ${+q.chapter} 章</a>`:'';
    return `<details class="qa" data-q="${esc(q.question+' '+q.answer)}"><summary>${esc(q.question)}</summary><div class="a"><span style="white-space:pre-line">${esc(q.answer)}</span>${link}</div></details>`};
  const pins=QAS.filter(q=>q.pinned);const rest=QAS.filter(q=>!q.pinned);
  const cats=[...new Set(rest.map(q=>q.category||'其他'))];
  return `${crumb([['常見問題']])}
  <h1>常見問題</h1><p class="muted" style="margin-top:8px">從社群、表單和棉花糖收到的問題，挑常被問的整理在這裡。</p>
  ${QAS.length>6?`<input class="search" id="qaSearch" type="search" placeholder="搜尋問題，例如：講義" style="margin-top:24px" aria-label="搜尋常見問題">`:''}
  ${pins.length?`<section class="sec pin"><h2 style="margin-bottom:14px">先看這幾題</h2>${pins.map(item).join('')}</section>`:''}
  ${cats.map(c=>`<section class="sec qa-cat"><h2 style="margin-bottom:14px">${esc(c)}</h2>${rest.filter(q=>(q.category||'其他')===c).map(item).join('')}</section>`).join('')}
  ${QAS.length?'':'<div class="empty" style="margin-top:24px">問題整理中</div>'}
  <p class="muted" id="qaEmpty" hidden style="margin-top:24px">找不到相關的問題，換個關鍵字試試，或直接問我。</p>
  <section class="sec">${askBox('找不到答案？','用這些管道問我，常被問到的會補進這頁。')}</section>`;
 },

 notes(){
  const used=TOPICS.filter(t=>NOTES.some(n=>keyOf(n.topic)===t.id));
  return `${crumb([['筆記分享']])}
  <h1>筆記分享</h1><p class="muted" style="margin-top:8px">我自己的重點整理，還有觀眾投稿的筆記。</p>
  ${used.length>1?`<div class="chips" style="margin-top:24px" id="noteChips">${[{id:'all',title:'全部'},...used].map((t,i)=>`<button class="chip" aria-pressed="${i===0}" data-topic="${t.id}">${esc(t.title)}</button>`).join('')}</div>`:''}
  <div class="two" style="margin-top:20px" id="noteGrid">${NOTES.map(n=>{const t=T(n.topic);return `<a class="note-card" href="#n-${n._key}" data-topic="${t?t.id:''}"><div class="meta">${t?`<span class="tag">${esc(t.title)}</span>`:''}${n.chapter?`<span>第 ${+n.chapter} 章</span>`:''}</div><h3>${esc(n.title)}</h3>${n.summary?`<p class="muted">${esc(n.summary)}</p>`:''}<div class="meta"><span>${esc(n.author||'')}</span><span class="mono">${esc(dateStr(n.date))}</span></div></a>`}).join('')||'<div class="empty">筆記整理中</div>'}</div>
  ${SITE.notes_submit_url?`<section class="sec box" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><h3>也想分享你的筆記？</h3><p class="muted">填表單投稿，我看過後會放上來，並標上你的名字。</p></div>${ext('我要投稿',SITE.notes_submit_url)}</section>`:''}`;
 },

 note(key){
  const n=NOTES.find(x=>x._key===key);if(!n)return pages.notfound();const t=T(n.topic);
  document.title=`${n.title}｜${SITE.name}`;
  return `${crumb([['筆記分享','#notes'],[n.title]])}
  <article class="note-body">
   <div class="meta">${t?`<span class="tag">${esc(t.title)}</span>`:''}<span>${esc(n.author||'')}</span><span class="mono">${esc(dateStr(n.date))}</span></div>
   <h1 style="font-size:32px;margin-top:8px">${esc(n.title)}</h1>
   ${n.summary?`<p class="muted" style="margin-top:12px;font-size:16px">${esc(n.summary)}</p>`:''}
   <div class="rich" style="margin-top:20px">${n.body||''}</div>
   <div class="links" style="margin-top:28px">${t&&n.chapter&&t.chapters[n.chapter-1]?`<a class="btn primary" href="#c-${t.id}-${+n.chapter}">回去看第 ${+n.chapter} 章影片</a>`:''}${n.pdf?`<a class="btn" href="${esc(fileUrl(n.pdf))}" target="_blank" rel="noopener" download>下載 PDF</a>`:''}</div>
   ${n.author?`<p class="muted" style="margin-top:24px;font-size:13px">本筆記著作權屬於${esc(n.author)}，轉載請註明出處。</p>`:''}
  </article>`;
 },

 about(){
  const a=SITE.about||{};
  return `${crumb([['關於我']])}
  <section class="t-hero">
   <div style="max-width:360px;aspect-ratio:1/1">${a.photo?`<img class="avatar-img" src="${esc(fileUrl(a.photo))}" alt="${esc(a.name||'')}">`:`<div class="board" style="height:100%;display:grid;place-items:center">${esc(a.name||'')}</div>`}</div>
   <div class="stack">
    <h1>${esc(a.title||('嗨，我是'+(a.name||'站長')))}</h1>
    ${a.bio?`<p class="muted" style="font-size:16px;white-space:pre-line">${esc(a.bio)}</p>`:''}
    ${arr(a.experience).length?`<div><h3>經歷</h3><ul class="muted">${arr(a.experience).map(e=>`<li><span class="mono">${esc(e.period)}</span> ${esc(e.role)}</li>`).join('')}</ul></div>`:''}
   </div>
  </section>
  <section class="sec two">
   ${arr(SITE.social).length?`<div class="box"><h3>在這裡找到我</h3><div class="links">${arr(SITE.social).map(s=>ext(s.label,s.url)).join('')}</div></div>`:''}
   ${a.email?`<div class="box"><h3>合作與演講邀約</h3><p class="muted" style="margin-top:6px">請寄信到下面的信箱，信件主旨註明「合作」。</p><p class="mono" style="margin-top:10px;user-select:all">${esc(a.email)}</p></div>`:''}
  </section>`;
 },

 support(){
  const s=SITE.support||{};
  return `${crumb([['支持我']])}
  <section class="stack" style="max-width:640px">
   <h1>${esc(s.title||'支持'+SITE.name)}</h1>
   ${s.intro?`<p class="muted" style="font-size:16px;white-space:pre-line">${esc(s.intro)}</p>`:''}
   <div>${s.url?`<a class="btn chalk" style="font-size:16px;padding:12px 24px" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.button_label||'前往抖內')}</a>`:'<span class="muted">抖內連結準備中</span>'}</div>
  </section>
  ${arr(s.uses).length?`<section class="sec box"><h3>抖內會用在哪裡</h3><ul class="muted">${arr(s.uses).map(u=>`<li>${esc(u)}</li>`).join('')}</ul></section>`:''}
  ${arr(s.tiers).length?`<section class="sec"><h2 style="margin-bottom:14px">贊助方案</h2><div class="tiers">${arr(s.tiers).map(x=>`<div class="tier" style="border-style:solid;color:var(--ink)"><h3>${esc(x.name)}</h3><p class="mono" style="margin-top:4px">${esc(x.price||'')}</p><p class="muted" style="margin-top:8px">${esc(x.description||'')}</p>${x.url?`<a class="btn chalk" style="margin-top:12px" href="${esc(x.url)}" target="_blank" rel="noopener">選這個</a>`:''}</div>`).join('')}</div></section>`:''}
  ${arr(s.thanks).length?`<section class="sec"><h2 style="margin-bottom:14px">謝謝你們</h2><div class="thanks">${arr(s.thanks).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></section>`:''}`;
 },

 privacy(){
  return `${crumb([['隱私權聲明']])}<article class="note-body"><h1 style="font-size:32px">隱私權聲明</h1><div class="rich" style="margin-top:16px">${SITE.privacy||''}</div></article>`;
 },

 notfound(){
  return `<section class="stack" style="align-items:flex-start;padding-block:40px">
   <span class="mono muted">404</span><h1>這頁不見了</h1><p class="muted">網址可能打錯了，或這個章節已經移除。</p>
   <div class="links"><a class="btn primary" href="#home">回首頁</a><a class="btn" href="#topics">看所有主題</a></div></section>`;
 }
};

/* ---------- 頁尾 ---------- */
function renderFooter(){
  const ask=arr(SITE.ask&&SITE.ask.links).filter(l=>l.url);
  $('#foot').innerHTML=`<div class="foot">
    <div><b>${esc(SITE.name)}</b><p>${esc(SITE.footer_note||'')}</p></div>
    <div><b>課程</b><a href="#topics">所有主題</a><a href="#qa">常見問題</a><a href="#notes">筆記分享</a></div>
    <div><b>關於</b><a href="#about">關於我</a><a href="#support">支持我</a>${SITE.privacy?'<a href="#privacy">隱私權聲明</a>':''}</div>
    ${ask.length?`<div><b>想問我</b>${ask.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>`:''}
  </div><p style="margin-top:24px;font-size:13px">© ${new Date().getFullYear()} ${esc(SITE.name)}${SITE.copyright?'・'+esc(SITE.copyright):''}</p>`;
}

/* ---------- 路由 ---------- */
function route(){
  const h=decodeURIComponent((location.hash||'#home').slice(1));let html,nav='',m;
  document.title=SITE.name||'';
  if(h==='home'||h==='')html=pages.home();
  else if(h==='topics'){html=pages.topics();nav='topics'}
  else if(m=h.match(/^t-(\w+)$/)){const t=T(m[1]);if(t){const f=t.chapters.findIndex((_,i)=>!done.has(`${t.id}-${i+1}`));html=pages.chapter(t.id,f<0?1:f+1,false)}else html=pages.notfound();nav='topics'}
  else if(m=h.match(/^c-(\w+)-(\d+)$/)){html=pages.chapter(m[1],m[2]);nav='topics'}
  else if(h==='qa'){html=pages.qa();nav='qa'}
  else if(h==='notes'){html=pages.notes();nav='notes'}
  else if(m=h.match(/^n-(.+)$/)){html=pages.note(m[1]);nav='notes'}
  else if(['about','support','privacy'].includes(h)){html=pages[h]();nav=h}
  else html=pages.notfound();
  $('#app').innerHTML=html;
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===nav));
  $('#mnav').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');
  window.scrollTo(0,0);
  const cur=document.querySelector('#sideList a.cur');if(cur){const ol=$('#sideList');ol.scrollTop=cur.parentElement.offsetTop-ol.offsetTop-40}
}

let tt;function toast(msg){const el=$('#toast');el.textContent=msg;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,2400)}

/* ---------- 互動 ---------- */
document.addEventListener('click',e=>{
  const st=e.target.closest('#sideToggle');if(st){const closed=$('#lesson').classList.toggle('closed');st.setAttribute('aria-expanded',!closed);if(isDesk())store('cs-side',closed?'closed':'open');return}
  if(e.target.closest('[data-share]')){
    const url=location.href;
    if(navigator.share){navigator.share({title:document.title,url}).catch(()=>{})}
    else if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>toast('已複製這一章的連結'),()=>toast(url))}
    else toast(url);
    return}
  const s=e.target.closest('[data-stamp]');if(s){const f=$('#yt');if(f){const base=f.src.split('?')[0];f.src=`${base}?rel=0&autoplay=1&start=${s.dataset.stamp}`;$('#player').scrollIntoView({behavior:'smooth',block:'center'})}return}
  const c=e.target.closest('#catChips .chip');if(c){document.querySelectorAll('#catChips .chip').forEach(b=>b.setAttribute('aria-pressed',b===c));const cat=c.dataset.cat;$('#topicGrid').innerHTML=TOPICS.filter(t=>cat==='全部'||t.category===cat).map(topicCard).join('');return}
  const n=e.target.closest('#noteChips .chip');if(n){document.querySelectorAll('#noteChips .chip').forEach(b=>b.setAttribute('aria-pressed',b===n));document.querySelectorAll('#noteGrid .note-card').forEach(card=>card.hidden=!(n.dataset.topic==='all'||card.dataset.topic===n.dataset.topic));return}
});
document.addEventListener('input',e=>{
  if(e.target.id!=='qaSearch')return;const q=e.target.value.trim().toLowerCase();let any=false;
  document.querySelectorAll('details.qa[data-q]').forEach(d=>{const hit=!q||d.dataset.q.toLowerCase().includes(q);d.hidden=!hit;if(hit)any=true;if(q&&hit)d.open=true});
  document.querySelectorAll('section.pin, section.qa-cat').forEach(s=>s.hidden=![...s.querySelectorAll('details.qa')].some(d=>!d.hidden));
  $('#qaEmpty').hidden=any;
});
$('#menuBtn').addEventListener('click',()=>{const o=$('#mnav').classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',o)});

/* ---------- 載入資料 ---------- */
async function getJSON(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw new Error(url);return JSON.parse(await r.text())}
async function load(){
  let d;
  try{d=await getJSON('data.json')}          // GitHub Pages 上由 Jekyll 產生
  catch(e){d=await getJSON('data.local.json')} // 本機預覽：python3 preview.py 產生
  SITE=d.site||{};SITE.name=SITE.name||'我的課程';
  TOPICS=Object.entries(d.topics||{}).map(([k,t])=>({...t,id:keyOf(t.id||k),chapters:arr(t.chapters)}))
    .filter(t=>!t.draft&&/^\w+$/.test(t.id))
    .sort((a,b)=>(a.order??999)-(b.order??999)||String(a.title).localeCompare(String(b.title)));
  TOPICS.forEach((t,i)=>t._idx=i);
  QAS=arr(d.qa);
  NOTES=Object.entries(d.notes||{}).map(([k,n])=>({...n,_key:keyOf(k)})).filter(n=>!n.draft)
    .sort((a,b)=>dateStr(b.date).localeCompare(dateStr(a.date)));
  $('#siteName').textContent=SITE.name;$('#logoMark').textContent=[...SITE.name][0]||'';
  renderFooter();
  window.addEventListener('hashchange',route);
  route();
}
load().catch(()=>{$('#app').innerHTML='<p class="loading">資料載入失敗，請重新整理頁面。</p>'});
})();
