"use client";
import { useMemo, useState, type ReactNode } from "react";
import type { AutoReplyComment } from "@/lib/auto-reply-comments";

type Props={pending:AutoReplyComment[];autoReplied:AutoReplyComment[]};
type Platform="all"|"instagram"|"tiktok"|"facebook"|"youtube";
const SIZE=10;
const accounts=[
 {key:"all",label:"All Accounts",sub:"All connected accounts"},
 {key:"imriders.official",label:"@imriders.official",sub:"IM Riders"},
 {key:"im.indomobil",label:"@im.indomobil",sub:"Indomobil eMotor"}
];
const platforms=[
 {key:"instagram",label:"Instagram",icon:"◎"},
 {key:"tiktok",label:"TikTok",icon:"♪"},
 {key:"facebook",label:"Facebook",icon:"f"},
 {key:"youtube",label:"YouTube",icon:"▶"}
] as const;
const platformIcon=(p:string)=>platforms.find(x=>x.key===p)?.icon||"•";
const fmt=(v:string|null)=>v?new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v)):"—";
const confStyle=(v:number|null)=>v===null?{background:"#f2f4f7",color:"#667085"}:v>=90?{background:"#eafaf2",color:"#087443"}:{background:"#fff5e8",color:"#b54708"};
const sourceStyle=(s:"DM"|"COMMENT")=>s==="DM"?{background:"#eeeaff",color:"#634fd2"}:{background:"#eaf4ff",color:"#2767c7"};

function Pager({page,total,setPage}:{page:number;total:number;setPage:(p:number)=>void}){
 const pages=Math.max(1,Math.ceil(total/SIZE)); if(pages<=1)return null;
 const nums:(number|string)[]=pages<=7?Array.from({length:pages},(_,i)=>i+1):[1,...(page>3?["…"]:[]),...Array.from({length:Math.min(pages-1,page+1)-Math.max(2,page-1)+1},(_,i)=>Math.max(2,page-1)+i),...(page<pages-2?["…"]:[]),pages];
 const from=(page-1)*SIZE+1,to=Math.min(page*SIZE,total);
 const btn=(active=false,disabled=false)=>({width:30,height:30,borderRadius:8,border:active?"1px solid #3d5be9":"1px solid #e3e7ef",background:active?"#3d5be9":"#fff",color:active?"#fff":disabled?"#b8bfce":"#5368e8",fontSize:10,fontWeight:800,cursor:disabled?"default":"pointer"} as const);
 return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:12,paddingTop:11,borderTop:"1px solid #eef0f6"}}>
  <span style={{color:"#98a2b3",fontSize:8.5}}>Showing {from}–{to} of {total}</span>
  <div style={{display:"flex",gap:4,alignItems:"center"}}>
   <button type="button" disabled={page===1} onClick={()=>setPage(page-1)} style={btn(false,page===1)}>‹</button>
   {nums.map((n,i)=>typeof n==="string"?<span key={`e${i}`} style={{width:25,textAlign:"center",color:"#98a2b3",fontSize:9}}>…</span>:<button key={n} type="button" onClick={()=>setPage(n)} style={btn(n===page)}>{n}</button>)}
   <button type="button" disabled={page===pages} onClick={()=>setPage(page+1)} style={btn(false,page===pages)}>›</button>
  </div>
 </div>;
}

function Meta({c}:{c:AutoReplyComment}){
 const confidence=c.reply?.aiConfidence??c.aiConfidence;
 return <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
  <span style={{width:27,height:27,borderRadius:8,display:"grid",placeItems:"center",background:"#f4f6fb",color:"#344054",fontWeight:900,fontSize:13}}>{platformIcon(c.platform)}</span>
  <strong style={{fontSize:9.5,color:"#27324a"}}>{c.username?`@${c.username}`:"@unknown"}</strong>
  <span style={{...sourceStyle(c.sourceType),borderRadius:999,padding:"4px 7px",fontSize:7.5,fontWeight:900}}>{c.sourceType}</span>
  {c.intent?<span style={{background:"#eef1ff",color:"#5368e8",borderRadius:999,padding:"4px 7px",fontSize:7.5,fontWeight:900}}>{c.intent}</span>:null}
  <span style={{...confStyle(confidence),borderRadius:999,padding:"4px 7px",fontSize:7.5,fontWeight:900}}>AI {confidence===null?"—":`${confidence.toFixed(0)}%`}</span>
 </div>;
}
function SourceLink({c}:{c:AutoReplyComment}){return c.commentUrl?<a href={c.commentUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",minHeight:28,padding:"0 9px",borderRadius:8,border:"1px solid #e1e6f0",background:"#fff",color:"#5368e8",textDecoration:"none",fontSize:8,fontWeight:900}}>{c.sourceType==="COMMENT"?"Open Content ↗":"Open DM ↗"}</a>:null;}

const card={border:"1px solid #e5e9f2",borderRadius:12,padding:11,background:"#fff"} as const;
const message={borderRadius:10,background:"#f7f9fd",padding:10,marginBottom:9} as const;
const label={color:"#8b93a7",fontSize:7.5,fontWeight:900,letterSpacing:".07em",textTransform:"uppercase" as const,marginBottom:4} as const;
const text={color:"#344054",fontSize:10.5,lineHeight:1.55,whiteSpace:"pre-wrap" as const} as const;
const textarea={width:"100%",boxSizing:"border-box" as const,resize:"vertical" as const,minHeight:82,border:"1px solid #d6def0",borderRadius:9,padding:10,outline:"none",font:"inherit",color:"#344054",fontSize:10.5,lineHeight:1.55,background:"#fff"} as const;

function ApprovalCard({c,draft,onDraft,onApprove,onEscalate,busy}:{c:AutoReplyComment;draft:string;onDraft:(v:string)=>void;onApprove:()=>void;onEscalate:()=>void;busy:boolean}){
 return <article style={card}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}><Meta c={c}/><span style={{fontSize:8,color:"#98a2b3"}}>{fmt(c.commentCreatedAt||c.createdAt)}</span></div>
  <div style={message}><div style={label}>Customer Message</div><div style={text}>{c.commentText}</div></div>
  <label style={{display:"grid",gap:5}}><span style={{...label,color:"#5368e8"}}>AI Suggested Reply — Edit Before Send</span><textarea value={draft} onChange={e=>onDraft(e.target.value)} rows={5} style={textarea}/></label>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:7,marginTop:9,flexWrap:"wrap"}}>
   <div style={{display:"flex",gap:6}}><SourceLink c={c}/><button type="button" disabled={busy} onClick={onEscalate} style={human}>Escalate to Human</button></div>
   <button type="button" disabled={busy||!draft.trim()} onClick={onApprove} style={{...approve,opacity:draft.trim()?1:.5}}>{busy?"Sending…":"➤ Approve & Send"}</button>
  </div>
 </article>;
}
function SentCard({c}:{c:AutoReplyComment}){
 const answer=c.reply?.finalReply||c.reply?.aiDraft||"Reply text unavailable.";
 return <article style={card}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}><Meta c={c}/><span style={{fontSize:8,color:"#98a2b3"}}>{fmt(c.reply?.sentAt||c.updatedAt)}</span></div>
  <div style={message}><div style={label}>Customer Message</div><div style={text}>{c.commentText}</div></div>
  <div style={{borderRadius:10,background:"#ecfbf4",border:"1px solid #d4f1e3",padding:10}}><div style={{...label,color:"#0b8a59"}}>AI Reply — Sent</div><div style={text}>{answer}</div></div>
  <div style={{marginTop:9}}><SourceLink c={c}/></div>
 </article>;
}

const human={minHeight:32,border:"1px solid #fedf89",borderRadius:8,background:"#fffbeb",color:"#b54708",padding:"0 10px",fontSize:8.5,fontWeight:900,cursor:"pointer"} as const;
const approve={minHeight:34,border:0,borderRadius:8,background:"#3d5be9",color:"#fff",padding:"0 12px",fontSize:9,fontWeight:900,cursor:"pointer"} as const;

export default function AutoReplyApprovalInbox({pending,autoReplied}:Props){
 const [account,setAccount]=useState("all");
 const [platform,setPlatform]=useState<Platform>("all");
 const [approvalPage,setApprovalPage]=useState(1);
 const [autoPage,setAutoPage]=useState(1);
 const [drafts,setDrafts]=useState<Record<string,string>>(Object.fromEntries(pending.map(x=>[x.id,x.reply?.finalReply||x.reply?.aiDraft||""])));
 const [loadingId,setLoadingId]=useState<string|null>(null);
 const [error,setError]=useState<string|null>(null);
 const filter=(items:AutoReplyComment[])=>items.filter(x=>(account==="all"||x.accountKey===account)&&(platform==="all"||x.platform===platform));
 const pendingFiltered=useMemo(()=>filter(pending),[pending,account,platform]);
 const autoFiltered=useMemo(()=>filter(autoReplied),[autoReplied,account,platform]);
 const pendingItems=pendingFiltered.slice((approvalPage-1)*SIZE,approvalPage*SIZE);
 const autoItems=autoFiltered.slice((autoPage-1)*SIZE,autoPage*SIZE);
 const setAccountFilter=(v:string)=>{setAccount(v);setApprovalPage(1);setAutoPage(1)};
 const setPlatformFilter=(v:Platform)=>{setPlatform(v);setApprovalPage(1);setAutoPage(1)};
 async function act(id:string,action:"approve"|"escalate"){
  if(action==="approve"&&!window.confirm("Send this exact edited reply through ManyChat now?"))return;
  setLoadingId(id);setError(null);
  try{
   const r=await fetch("/api/auto-reply/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId:id,action,finalReply:drafts[id]||""})});
   const p=await r.json();if(!r.ok)throw new Error(p?.error||"Unable to update reply.");
   window.location.reload();
  }catch(e){setError(e instanceof Error?e.message:"Unable to update reply.")}finally{setLoadingId(null)}
 }
 return <>
  <section style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1.25fr)",gap:12,marginBottom:14}}>
   <div style={filterPanel}><div style={filterTitle}>SELECT ACCOUNT</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{accounts.map(a=><button key={a.key} type="button" onClick={()=>setAccountFilter(a.key)} style={{...accountButton,...(account===a.key?accountActive:{})}}><span style={{width:28,height:28,borderRadius:"50%",display:"grid",placeItems:"center",background:account===a.key?"#101b43":"#eef1f7",color:account===a.key?"#fff":"#344054",fontSize:8,fontWeight:900}}>IM</span><span style={{textAlign:"left"}}><strong style={{display:"block",fontSize:9}}>{a.label}</strong><small style={{color:"#98a2b3",fontSize:7}}>{a.sub}</small></span></button>)}</div></div>
   <div style={filterPanel}><div style={filterTitle}>SELECT PLATFORM</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><button type="button" onClick={()=>setPlatformFilter("all")} style={{...platformButton,...(platform==="all"?platformActive:{})}}>All</button>{platforms.map(p=><button key={p.key} type="button" onClick={()=>setPlatformFilter(p.key)} style={{...platformButton,...(platform===p.key?platformActive:{})}}><span style={{fontWeight:900}}>{p.icon}</span>{p.label}</button>)}</div></div>
  </section>
  {error?<div style={{marginBottom:12,padding:10,borderRadius:9,background:"#fff5f5",border:"1px solid #ffd6d6",color:"#b42318",fontSize:9}}>{error}</div>:null}
  <section style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:14,alignItems:"start"}}>
   <ReplyColumn title="AI Reply — Need Approval" subtitle="AI generated replies that need your review before sending" count={pendingFiltered.length} approval>
    {pendingItems.length?pendingItems.map(c=><ApprovalCard key={c.id} c={c} draft={drafts[c.id]||""} busy={loadingId===c.id} onDraft={v=>setDrafts(x=>({...x,[c.id]:v}))} onApprove={()=>act(c.id,"approve")} onEscalate={()=>act(c.id,"escalate")}/>):<Empty text="No pending approval for this account / platform."/>}
    <Pager page={approvalPage} total={pendingFiltered.length} setPage={setApprovalPage}/>
   </ReplyColumn>
   <ReplyColumn title="AI Auto Reply — Sent" subtitle="Questions answered automatically by AI" count={autoFiltered.length}>
    {autoItems.length?autoItems.map(c=><SentCard key={c.id} c={c}/>):<Empty text="No auto replies for this account / platform."/>}
    <Pager page={autoPage} total={autoFiltered.length} setPage={setAutoPage}/>
   </ReplyColumn>
  </section>
 </>;
}

function ReplyColumn({title,subtitle,count,approval=false,children}:{title:string;subtitle:string;count:number;approval?:boolean;children:ReactNode}){
 return <section style={{background:"#fff",border:"1px solid #e7eaf2",borderRadius:15,padding:12,boxShadow:"0 8px 22px rgba(39,48,92,.045)"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"7px 8px 11px",borderBottom:"1px solid #eef0f6"}}><div><h3 style={{margin:0,fontSize:13.5,color:"#27324a"}}>{title}</h3><p style={{margin:"4px 0 0",fontSize:8.5,color:"#98a2b3"}}>{subtitle}</p></div><div style={{textAlign:"right"}}><strong style={{fontSize:20,color:approval?"#d54856":"#078657"}}>{count}</strong><span style={{display:"block",fontSize:7.5,fontWeight:900,color:approval?"#d54856":"#078657"}}>{approval?"Pending":"Auto Replied"}</span></div></div>
  <div style={{display:"grid",gap:9,marginTop:9}}>{children}</div>
 </section>;
}
function Empty({text}:{text:string}){return <div style={{minHeight:170,border:"1px dashed #dfe4ef",borderRadius:11,display:"grid",placeItems:"center",padding:20,color:"#98a2b3",fontSize:9,textAlign:"center"}}>{text}</div>}

const filterPanel={background:"#fff",border:"1px solid #e7eaf2",borderRadius:14,padding:12,boxShadow:"0 7px 18px rgba(39,48,92,.035)"} as const;
const filterTitle={color:"#8a92a8",fontSize:7.5,fontWeight:900,letterSpacing:".12em",marginBottom:8} as const;
const accountButton={display:"inline-flex",alignItems:"center",gap:7,minHeight:44,border:"1px solid #e4e7ef",borderRadius:9,background:"#fff",padding:"0 9px",color:"#344054",cursor:"pointer"} as const;
const accountActive={border:"1px solid #4b66e9",background:"#f7f8ff",boxShadow:"0 0 0 2px rgba(75,102,233,.07)"} as const;
const platformButton={minHeight:34,display:"inline-flex",alignItems:"center",gap:6,border:"1px solid #e4e7ef",borderRadius:8,background:"#fff",color:"#667085",padding:"0 10px",fontSize:8.5,fontWeight:800,cursor:"pointer"} as const;
const platformActive={border:"1px solid #4b66e9",background:"#eef1ff",color:"#4059d7"} as const;
