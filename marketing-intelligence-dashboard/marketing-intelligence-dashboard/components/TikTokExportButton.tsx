"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function TikTokExportButton(){
  const params=useSearchParams();
  const [open,setOpen]=useState(false);

  const download=(type:string)=>{
    const q=new URLSearchParams();
    q.set("type",type);
    if(type==="filtered"){
      const from=params.get("from");
      const to=params.get("to");
      if(from) q.set("from",from);
      if(to) q.set("to",to);
    }
    window.location.href=`/api/tiktok/export?${q.toString()}`;
    setOpen(false);
  };

  return <div style={{position:"relative"}}>
    <button onClick={()=>setOpen(!open)} style={{
      border:"1px solid #dce1ef",
      background:"#fff",
      borderRadius:10,
      padding:"9px 14px",
      fontSize:12,
      fontWeight:800,
      color:"#59617a",
      cursor:"pointer"
    }}>
      ↓ Download CSV ▾
    </button>
    {open && <div style={{
      position:"absolute",right:0,top:42,zIndex:20,
      background:"#fff",border:"1px solid #e2e6f4",
      borderRadius:10,padding:6,width:190,
      boxShadow:"0 12px 30px rgba(0,0,0,.12)"
    }}>
      <button onClick={()=>download("filtered")} style={{width:"100%",padding:10,border:0,background:"#fff",textAlign:"left",cursor:"pointer"}}>
        Download Filtered CSV
      </button>
      <button onClick={()=>download("all")} style={{width:"100%",padding:10,border:0,background:"#fff",textAlign:"left",cursor:"pointer"}}>
        Download All CSV
      </button>
    </div>}
  </div>;
}
