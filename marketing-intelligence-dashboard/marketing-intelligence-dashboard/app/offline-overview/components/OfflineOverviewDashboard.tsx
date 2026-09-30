"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { AnnualBigEvent, AnnualBigEventData } from "@/lib/annual-big-event";
import type { ReportMediaData } from "@/lib/report-media";
import styles from "../OfflineOverview.module.css";

type Props = {
  annual: AnnualBigEventData;
  launchingRegional: AnnualBigEventData;
  regular: AnnualBigEventData;
  media: ReportMediaData;
};

type CategoryKey = "ALL" | "Annual Big Event" | "Launching & Regional Event" | "Reguler Event";
type OverviewEvent = AnnualBigEvent & { category: Exclude<CategoryKey, "ALL"> };

function num(v:number){ return new Intl.NumberFormat("en-US").format(Math.round(v)); }
function compact(v:number){ return new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1}).format(v); }
function money(v:number){ return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Math.round(v)); }
function moneyCompact(v:number){
  if(v>=1_000_000_000) return `Rp${(v/1_000_000_000).toFixed(1)}B`;
  if(v>=1_000_000) return `Rp${(v/1_000_000).toFixed(1)}M`;
  return money(v);
}
function pct(a:number,b:number){ return b ? a/b*100 : 0; }
function pctText(v:number){ return `${v.toFixed(1)}%`; }
function parseEventDate(value:string){
  if(!value) return null;
  const t=Date.parse(`${value.slice(0,10)}T00:00:00Z`);
  return Number.isFinite(t) ? new Date(t) : null;
}
function dateText(value:string){
  const d=parseEventDate(value); if(!d) return "—";
  return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(d);
}
function monthInfo(value:string){
  const d=parseEventDate(value); if(!d) return null;
  return { key:d.getUTCFullYear()*100+d.getUTCMonth(), label:new Intl.DateTimeFormat("en-US",{month:"short",year:"2-digit",timeZone:"UTC"}).format(d) };
}
function statusClass(status:string){
  const s=status.toLowerCase();
  if(s.includes("complete")||s.includes("finish")) return styles.complete;
  if(s.includes("ongoing")||s.includes("on going")) return styles.ongoing;
  return styles.upcoming;
}

export default function OfflineOverviewDashboard({annual,launchingRegional,regular,media}:Props){
  const router=useRouter();
  const [year,setYear]=useState("ALL");
  const [category,setCategory]=useState<CategoryKey>("ALL");
  const [refreshing,setRefreshing]=useState(false);

  const events=useMemo<OverviewEvent[]>(()=>[
    ...annual.events.map(e=>({...e,category:"Annual Big Event" as const})),
    ...launchingRegional.events.map(e=>({...e,category:"Launching & Regional Event" as const})),
    ...regular.events.map(e=>({...e,category:"Reguler Event" as const}))
  ],[annual.events,launchingRegional.events,regular.events]);

  const years=useMemo(()=>Array.from(new Set(events.map(e=>e.year).filter((v):v is number=>v!==null))).sort((a,b)=>b-a),[events]);
  const filtered=useMemo(()=>events.filter(e=>(year==="ALL"||String(e.year)===year)&&(category==="ALL"||e.category===category)),[events,year,category]);
  const mediaFiltered=useMemo(()=>media.events.filter(e=>year==="ALL"||String(e.year)===year),[media.events,year]);

  const summary=useMemo(()=>{
    const totalBudget=filtered.reduce((s,e)=>s+e.totalBudget,0);
    const totalSpk=filtered.reduce((s,e)=>s+e.totalSpk,0);
    const totalTestRide=filtered.reduce((s,e)=>s+e.testRide,0);
    const totalFootTraffic=filtered.reduce((s,e)=>s+e.footTraffic,0);
    const eventMediaPosting=filtered.reduce((s,e)=>s+e.mediaPosting,0);
    const totalBlast=mediaFiltered.reduce((s,e)=>s+e.totalBlast,0);
    const reportPosting=mediaFiltered.reduce((s,e)=>s+e.totalPosting,0);
    return {
      totalEvents:filtered.length,totalBudget,totalSpk,totalTestRide,totalFootTraffic,eventMediaPosting,totalBlast,reportPosting,
      trafficToTestRide:pct(totalTestRide,totalFootTraffic),testRideToSpk:pct(totalSpk,totalTestRide),
      costPerSpk:totalSpk?totalBudget/totalSpk:0,costPerTestRide:totalTestRide?totalBudget/totalTestRide:0
    };
  },[filtered,mediaFiltered]);

  const categoryData=useMemo(()=>[
    "Annual Big Event","Launching & Regional Event","Reguler Event"
  ].map(name=>{
    const rows=filtered.filter(e=>e.category===name);
    return {name:name==="Launching & Regional Event"?"Launching & Regional":name,events:rows.length,spk:rows.reduce((s,e)=>s+e.totalSpk,0),budget:rows.reduce((s,e)=>s+e.totalBudget,0)};
  }),[filtered]);

  const monthly=useMemo(()=>{
    const map=new Map<number,{month:string;events:number;spk:number;testRide:number}>();
    filtered.forEach(e=>{ const m=monthInfo(e.startDate); if(!m)return; const row=map.get(m.key)||{month:m.label,events:0,spk:0,testRide:0}; row.events++; row.spk+=e.totalSpk; row.testRide+=e.testRide; map.set(m.key,row); });
    return Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([,v])=>v);
  },[filtered]);

  const modelData=useMemo(()=>{
    const map=new Map<string,number>();
    filtered.forEach(e=>e.spkBreakdown.forEach(i=>map.set(i.model,(map.get(i.model)||0)+i.qty)));
    return Array.from(map.entries()).map(([model,spk])=>({model,spk})).sort((a,b)=>b.spk-a.spk).slice(0,8);
  },[filtered]);

  const cityData=useMemo(()=>{
    const map=new Map<string,{city:string;events:number;spk:number}>();
    filtered.forEach(e=>{ const c=e.city||"Unknown"; const r=map.get(c)||{city:c,events:0,spk:0}; r.events++; r.spk+=e.totalSpk; map.set(c,r); });
    return Array.from(map.values()).sort((a,b)=>b.spk-a.spk||b.events-a.events).slice(0,8);
  },[filtered]);

  const mediaTop=useMemo(()=>{
    const map=new Map<string,number>();
    mediaFiltered.forEach(e=>e.blastMedia.forEach(name=>map.set(name,(map.get(name)||0)+1)));
    return Array.from(map.entries()).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,8);
  },[mediaFiltered]);

  const latest=useMemo(()=>[...filtered].sort((a,b)=>(parseEventDate(b.startDate)?.getTime()||0)-(parseEventDate(a.startDate)?.getTime()||0)).slice(0,10),[filtered]);
  const connected=[annual.connected,launchingRegional.connected,regular.connected,media.connected].filter(Boolean).length;

  function refresh(){ setRefreshing(true); router.refresh(); window.setTimeout(()=>setRefreshing(false),900); }

  return <div className={styles.page}>
    <header className={styles.topbar}>
      <div><p className={styles.eyebrow}>OFFLINE MARKETING</p><h1>Offline Overview</h1><p className={styles.subtitle}>Consolidated performance across Annual Big Event, Launching & Regional, Reguler Event, and Report Media.</p></div>
      <div className={styles.actions}>
        <div className={connected===4?styles.sourceOk:styles.sourceWarn}><span/><div><strong>{connected}/4 Sources Connected</strong><small>Marketing Event Detail Report</small></div></div>
        <button type="button" className={styles.refresh} onClick={refresh} disabled={refreshing}>{refreshing?"Refreshing...":"↻ Refresh"}</button>
      </div>
    </header>

    <section className={styles.filters}>
      <label><span>YEAR</span><select value={year} onChange={e=>setYear(e.target.value)}><option value="ALL">All Years</option>{years.map(v=><option value={v} key={v}>{v}</option>)}</select></label>
      <label><span>EVENT CATEGORY</span><select value={category} onChange={e=>setCategory(e.target.value as CategoryKey)}><option value="ALL">All Offline Events</option><option>Annual Big Event</option><option>Launching & Regional Event</option><option>Reguler Event</option></select></label>
      <div className={styles.current}><span>CURRENT VIEW</span><strong>{summary.totalEvents} event{summary.totalEvents===1?"":"s"}</strong></div>
    </section>

    <section className={styles.kpis}>{[
      ["Total Events",num(summary.totalEvents),"Across selected categories"],
      ["Total Budget",moneyCompact(summary.totalBudget),"Recorded offline spend"],
      ["Total SPK",num(summary.totalSpk),`${pctText(summary.testRideToSpk)} from test ride`],
      ["Test Ride",num(summary.totalTestRide),`${pctText(summary.trafficToTestRide)} from foot traffic`],
      ["Foot Traffic",compact(summary.totalFootTraffic),"Recorded event visitors"],
      ["Event Media Posting",num(summary.eventMediaPosting),"From event sheets"],
      ["Media Blast",num(summary.totalBlast),"From Report Media"],
      ["Media Report Posting",num(summary.reportPosting),"Published media coverage"]
    ].map(([label,value,note])=><article className={styles.kpi} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>

    <section className={styles.quick}>{[
      ["Annual Big Event","/annual-big-event",annual],
      ["Launching & Regional","/launching-regional-event",launchingRegional],
      ["Reguler Event","/side-event",regular],
      ["Report Media","/report-media",media]
    ].map(([title,href,data])=><Link key={String(title)} href={String(href)} className={styles.quickCard}><i className={(data as AnnualBigEventData|ReportMediaData).connected?styles.iconOk:styles.iconOff}>{String(title).slice(0,1)}</i><div><strong>{String(title)}</strong><span>{(data as AnnualBigEventData|ReportMediaData).connected?"Connected":"Disconnected"}</span></div><b>›</b></Link>)}</section>

    <section className={styles.grid}>
      <article className={styles.wide}><Head title="Event Category Performance" sub="SPK and budget contribution by offline event category."/><div className={styles.chart}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={categoryData}><CartesianGrid stroke="#edf0f6" vertical={false}/><XAxis dataKey="name" tick={{fontSize:9}} axisLine={false} tickLine={false}/><YAxis yAxisId="left" tick={{fontSize:9}} axisLine={false} tickLine={false}/><YAxis yAxisId="right" orientation="right" tickFormatter={v=>moneyCompact(Number(v))} tick={{fontSize:9}} axisLine={false} tickLine={false}/><Tooltip formatter={(v,n)=>[n==="Budget"?money(Number(v)):num(Number(v)),String(n)]}/><Legend wrapperStyle={{fontSize:9}}/><Bar yAxisId="left" dataKey="spk" name="SPK" fill="#4d64e6" radius={[6,6,0,0]}/><Line yAxisId="right" type="monotone" dataKey="budget" name="Budget" stroke="#8a62df" strokeWidth={3}/></ComposedChart></ResponsiveContainer></div></article>
      <article className={styles.panel}><Head title="Offline Funnel" sub="Visitor conversion through the event journey."/><div className={styles.funnel}>{[["Foot Traffic",summary.totalFootTraffic,100],["Test Ride",summary.totalTestRide,summary.totalFootTraffic?summary.totalTestRide/summary.totalFootTraffic*100:0],["SPK",summary.totalSpk,summary.totalFootTraffic?summary.totalSpk/summary.totalFootTraffic*100:0]].map(([label,value,width])=><div className={styles.funnelRow} key={String(label)}><span>{label}</span><strong>{num(Number(value))}</strong><i style={{width:`${Math.max(Number(width),12)}%`}}/></div>)}</div><div className={styles.eff}>{[["Traffic → Test Ride",pctText(summary.trafficToTestRide)],["Test Ride → SPK",pctText(summary.testRideToSpk)],["Cost / SPK",moneyCompact(summary.costPerSpk)],["Cost / Test Ride",moneyCompact(summary.costPerTestRide)]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></article>
    </section>

    <section className={styles.grid}>
      <article className={styles.wide}><Head title="Monthly Offline Activity" sub="Event count, SPK, and test ride by month."/><div className={styles.chart}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={monthly}><CartesianGrid stroke="#edf0f6" vertical={false}/><XAxis dataKey="month" tick={{fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:9}} axisLine={false} tickLine={false}/><Tooltip/><Legend wrapperStyle={{fontSize:9}}/><Bar dataKey="events" name="Events" fill="#4d64e6" radius={[5,5,0,0]}/><Line type="monotone" dataKey="testRide" name="Test Ride" stroke="#26a98a" strokeWidth={2.5} dot={false}/><Line type="monotone" dataKey="spk" name="SPK" stroke="#8a62df" strokeWidth={2.5} dot={false}/></ComposedChart></ResponsiveContainer></div></article>
      <article className={styles.panel}><Head title="SPK by Model" sub="Model contribution from event SPK breakdown."/><div className={styles.rank}>{modelData.length?modelData.map((x,i)=><div className={styles.rankRow} key={x.model}><span>{i+1}</span><div><strong>{x.model}</strong><i><b style={{width:`${Math.max(5,x.spk/Math.max(modelData[0]?.spk||1,1)*100)}%`}}/></i></div><em>{num(x.spk)}</em></div>):<p className={styles.empty}>No SPK model breakdown available.</p>}</div></article>
    </section>

    <section className={styles.grid}>
      <article className={styles.panel}><Head title="Top Cities" sub="Cities ranked by recorded SPK."/><div>{cityData.length?cityData.map((x,i)=><div className={styles.city} key={x.city}><b>{i+1}</b><div><strong>{x.city}</strong><span>{x.events} event{x.events===1?"":"s"}</span></div><em>{num(x.spk)} SPK</em></div>):<p className={styles.empty}>No city performance available.</p>}</div></article>
      <article className={styles.panel}><Head title="Media Outlet Frequency" sub="Most frequently listed blast outlets in Report Media."/><div className={styles.mediaChart}>{mediaTop.length?<ResponsiveContainer width="100%" height="100%"><BarChart data={mediaTop} layout="vertical"><CartesianGrid stroke="#edf0f6" horizontal={false}/><XAxis type="number" tick={{fontSize:8}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={105} tick={{fontSize:8}} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="count" name="Events" fill="#8a62df" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer>:<p className={styles.empty}>No media outlet data available.</p>}</div></article>
    </section>

    <section className={styles.full}><Head title="Latest Offline Events" sub="Most recent 10 event records under the selected filter."/><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Date</th><th>Category</th><th>Event</th><th>City</th><th>Budget</th><th>SPK</th><th>Test Ride</th><th>Status</th></tr></thead><tbody>{latest.length?latest.map(e=><tr key={`${e.category}-${e.id}`}><td>{dateText(e.startDate)}</td><td>{e.category}</td><td><strong>{e.eventName}</strong></td><td>{e.city||"—"}</td><td>{money(e.totalBudget)}</td><td>{num(e.totalSpk)}</td><td>{num(e.testRide)}</td><td><span className={statusClass(e.status)}>{e.status||"—"}</span></td></tr>):<tr><td colSpan={8} className={styles.emptyCell}>No offline event data found for the selected filter.</td></tr>}</tbody></table></div></section>

    <footer className={styles.footer}>Offline Marketing Overview • Marketing Event Detail Report</footer>
  </div>;
}

function Head({title,sub}:{title:string;sub:string}){
  return <div className={styles.head}><div><h2>{title}</h2><p>{sub}</p></div></div>;
}
