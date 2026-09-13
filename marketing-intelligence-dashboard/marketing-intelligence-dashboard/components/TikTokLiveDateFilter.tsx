"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";


export default function TikTokLiveDateFilter(){

  const router = useRouter();

  const params = useSearchParams();


  const currentFrom =
    params.get("from") || "";


  const currentTo =
    params.get("to") || "";


  const [from,setFrom] =
    useState(currentFrom);


  const [to,setTo] =
    useState(currentTo);

  const [activeRange,setActiveRange] =
    useState("");



  function applyFilter(){

  if(!from || !to) return;

  setActiveRange("");

  router.push(
    `/tiktok-live?from=${from}&to=${to}`
  );

}



function quickRange(
  days:number,
  label:string
){

    
    const today =
      new Date();


    const start =
      new Date();


    start.setDate(
      today.getDate() - days
    );


    const fromDate =
      start.toISOString()
      .slice(0,10);


    const toDate =
      today.toISOString()
      .slice(0,10);


    setFrom(fromDate);
    setTo(toDate);


    router.push(
      `/tiktok-live?from=${fromDate}&to=${toDate}`
    );

  }



  function thisMonth(){

    const date =
      new Date();


    const first =
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );


    const fromDate =
      first.toISOString()
      .slice(0,10);


    const toDate =
      date.toISOString()
      .slice(0,10);


    setFrom(fromDate);
    setTo(toDate);


    router.push(
      `/tiktok-live?from=${fromDate}&to=${toDate}`
    );

  }



  function lastMonth(){

    const date =
      new Date();


    const first =
      new Date(
        date.getFullYear(),
        date.getMonth()-1,
        1
      );


    const last =
      new Date(
        date.getFullYear(),
        date.getMonth(),
        0
      );


    const fromDate =
      first.toISOString()
      .slice(0,10);


    const toDate =
      last.toISOString()
      .slice(0,10);


    setFrom(fromDate);
    setTo(toDate);


    router.push(
      `/tiktok-live?from=${fromDate}&to=${toDate}`
    );

  }



  const buttonStyle = {
    padding:"8px 14px",
    borderRadius:8,
    border:"1px solid #d1d5db",
    background:"white",
    cursor:"pointer",
    fontSize:13
  };


  return (

    <section
      className="panel"
      style={{
        marginBottom:16
      }}
    >

      <h3>
        📅 Reporting Period
      </h3>


      <div
        style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
          gap:20,
          flexWrap:"wrap"
        }}
      >


        {/* DATE PICKER */}

        <div
          style={{
            display:"flex",
            alignItems:"center",
            gap:10
          }}
        >

          <input
            type="date"
            value={from}
            onChange={(e)=>
              setFrom(e.target.value)
            }
            style={{
              padding:"10px 12px",
              borderRadius:8,
              border:"1px solid #d1d5db"
            }}
          />


          <span>
            -
          </span>


          <input
            type="date"
            value={to}
            onChange={(e)=>
              setTo(e.target.value)
            }
            style={{
              padding:"10px 12px",
              borderRadius:8,
              border:"1px solid #d1d5db"
            }}
          />


          <button
            onClick={applyFilter}
            style={{
              ...buttonStyle,
              background:"#4059d7",
              color:"white",
              border:"none",
              fontWeight:600
            }}
          >
            Apply
          </button>

        </div>



        {/* QUICK RANGE */}

        <div
          style={{
            display:"flex",
            alignItems:"center",
            gap:8,
            flexWrap:"wrap"
          }}
        >

          <button
            style={buttonStyle}
            onClick={()=>quickRange(0)}
          >
            Today
          </button>


          <button
            style={buttonStyle}
            onClick={()=>quickRange(7)}
          >
            7D
          </button>


          <button
            style={buttonStyle}
            onClick={()=>quickRange(30)}
          >
            30D
          </button>


          <button
            style={buttonStyle}
            onClick={thisMonth}
          >
            Month
          </button>


          <button
            style={buttonStyle}
            onClick={lastMonth}
          >
            Last Month
          </button>


          <button
            style={buttonStyle}
            onClick={()=>quickRange(90)}
          >
            90D
          </button>


        </div>


      </div>


    </section>

  );

}