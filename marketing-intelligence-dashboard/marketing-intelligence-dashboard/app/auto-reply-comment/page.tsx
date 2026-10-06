import Sidebar from "@/components/Sidebar";
import AutoReplyApprovalInbox from "@/components/AutoReplyApprovalInbox";
import { getAutoReplyDashboardData } from "@/lib/auto-reply-comments";

export const dynamic = "force-dynamic";

function compact(value:number){return new Intl.NumberFormat("en-US").format(value)}
function fmt(value:string){return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value))}
function platformLabel(value:string){return value.charAt(0).toUpperCase()+value.slice(1)}

export default async function AutoReplyCommentPage(){
 const data=await getAutoReplyDashboardData();
 const manychat=Boolean(process.env.MANYCHAT_WEBHOOK_SECRET);
 const gemini=Boolean(process.env.GEMINI_API_KEY);
 const supabase=Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SECRET_KEY);
 const dispatcher=Boolean(process.env.MANYCHAT_API_KEY);
 const totalIncoming=data.counts.pendingApproval+data.counts.autoReplied;
 return <div className="app-shell">
  <Sidebar activeItem="Auto Reply Comment"/>
  <main className="main-content">
   <header className="topbar">
    <div><h1>Auto Reply</h1><p>AI powered customer care across all social media channels</p></div>
    <div className="topbar-actions"><div className="period-select"><span>STATUS</span><strong>System Online</strong></div><div className="avatar">CS</div><form action="/api/logout" method="post"><button className="logout-button">Logout</button></form></div>
   </header>

   <section style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:14,padding:"14px 16px",borderRadius:14,background:"linear-gradient(120deg,#243db7,#624edc 55%,#a955ca)",color:"#fff"}}>
    <div><div style={{fontSize:8,fontWeight:900,letterSpacing:".12em",opacity:.75}}>SOCIAL CUSTOMER CARE AI</div><h2 style={{margin:"5px 0 0",fontSize:22,letterSpacing:"-.03em"}}>Auto Reply Control Center</h2></div>
    <div style={{display:"flex",gap:7,flexWrap:"wrap",justifyContent:"flex-end",fontSize:8,fontWeight:800}}>{["Message","ManyChat","Gemini","Approval","Send"].map((x,i)=><span key={x} style={{padding:"7px 9px",borderRadius:8,background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.18)"}}>{i?"→ ":""}{x}</span>)}</div>
   </section>

   <section style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,marginBottom:14}}>
    {[{label:"Incoming in Queue",value:compact(totalIncoming),note:"Approval + sent feed"},{label:"Need Approval",value:compact(data.counts.pendingApproval),note:"Human review required"},{label:"Auto Replied",value:compact(data.counts.autoReplied),note:"Already answered"},{label:"Escalated Human",value:compact(data.counts.escalated),note:"Needs manual handling"}].map((x)=><article key={x.label} className="kpi-card"><p>{x.label}</p><strong>{x.value}</strong><span style={{color:"#98a2b3",fontSize:8}}>{x.note}</span></article>)}
   </section>

   <AutoReplyApprovalInbox pending={data.pending} autoReplied={data.autoReplied}/>

   <section style={{display:"grid",gridTemplateColumns:"1.1fr .9fr",gap:14,marginTop:14}}>
    <article className="panel">
     <div className="panel-header"><div><h3>Workflow Status</h3><p>Current system status and activity</p></div></div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
      {[['ManyChat Webhook',manychat?'Connected':'Missing'],['Gemini AI',gemini?'Ready':'Missing'],['Supabase Database',supabase?'Connected':'Missing'],['Auto Reply System',dispatcher?'Ready':'Approval Only']].map(([name,status])=><div key={name} style={{padding:10,borderRadius:10,background:"#fbfcff",border:"1px solid #eef0f6"}}><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{width:7,height:7,borderRadius:"50%",background:status.includes('Missing')?'#ef6470':'#2dbb83'}}/><strong style={{fontSize:8.5,color:"#344054"}}>{name}</strong></div><div style={{marginTop:6,color:status.includes('Missing')?'#b42318':'#087443',fontSize:8,fontWeight:800}}>{status}</div></div>)}
     </div>
    </article>
    <article className="panel">
     <div className="panel-header"><div><h3>Approval Guardrails</h3><p>Rules for direct AI reply and human approval</p></div></div>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <div style={{padding:10,borderRadius:10,background:"#ecfbf4",border:"1px solid #d4f1e3"}}><strong style={{display:"block",color:"#087443",fontSize:9,marginBottom:6}}>Auto Reply — Direct Send</strong>{['Product information','Price / OTR','Dealer information','Corporate information','General non-transactional questions'].map(x=><div key={x} style={{fontSize:8,color:"#3d6b58",marginTop:4}}>✓ {x}</div>)}</div>
      <div style={{padding:10,borderRadius:10,background:"#fff8eb",border:"1px solid #ffe5b5"}}><strong style={{display:"block",color:"#b54708",fontSize:9,marginBottom:6}}>Requires Approval</strong>{['Complaint / technical issue','Warranty / service','Transaction / delivery / stock','Promo / discount / installment','Sensitive or unclear context','Low confidence (< 90%)'].map(x=><div key={x} style={{fontSize:8,color:"#7c5a25",marginTop:4}}>! {x}</div>)}</div>
     </div>
    </article>
   </section>

   <section className="panel table-panel" style={{marginTop:14}}>
    <div className="panel-header"><div><h3>Recent Approval Activity</h3><p>Audit trail of replies, escalations, and direct AI answers</p></div></div>
    <div className="table-wrap"><table><thead><tr><th>Updated</th><th>Account</th><th>Platform</th><th>Source</th><th>Comment</th><th>Action</th><th>Answer</th><th>Note</th></tr></thead><tbody>
     {data.recentActivity.length?data.recentActivity.map(item=><tr key={item.id}>
      <td>{fmt(item.createdAt)}</td><td>{item.accountKey?`@${item.accountKey}`:'—'}</td><td>{platformLabel(item.platform)}</td><td><span style={{borderRadius:999,padding:'4px 7px',background:item.sourceType==='DM'?'#eeeaff':'#eaf4ff',color:item.sourceType==='DM'?'#634fd2':'#2767c7',fontSize:8,fontWeight:900}}>{item.sourceType}</span></td>
      <td style={{maxWidth:280}}><div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.commentText||'—'}</div>{item.commentUrl?<a href={item.commentUrl} target="_blank" rel="noreferrer" style={{fontSize:8,color:'#5368e8',textDecoration:'none'}}>Open Content ↗</a>:null}</td>
      <td><strong style={{fontSize:8}}>{item.action}</strong></td><td style={{maxWidth:280}}><div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.answer||'—'}</div></td><td style={{maxWidth:220}}><div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.note||'—'}</div></td>
     </tr>):<tr><td colSpan={8} style={{textAlign:'center',padding:30,color:'#98a2b3'}}>No activity yet.</td></tr>}
    </tbody></table></div>
   </section>
   <footer>Auto Reply • ManyChat + Gemini + Vercel + Supabase</footer>
  </main>
 </div>;
}
