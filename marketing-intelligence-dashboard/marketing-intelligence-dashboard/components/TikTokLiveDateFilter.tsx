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


  const [from, setFrom] =
    useState(currentFrom);


  const [to, setTo] =
    useState(currentTo);


  const [activeRange, setActiveRange] =
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

    setActiveRange(label);



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

    setActiveRange("Month");



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

    setActiveRange("Last Month");



    router.push(
      `/tiktok-live?from=${fromDate}&to=${toDate}`
    );

  }



  function buttonStyle(
    active:boolean = false
  ){

    return {

      padding:"8px 14px",

      borderRadius:8,

      border:
        active
        ? "1px solid #4059d7"
        : "1px solid #d1d5db",

      background:
        active
        ? "#4059d7"
        : "white",

      color:
        active
        ? "white"
        : "#111827",

      cursor:"pointer",

      fontSize:13,

      fontWeight:600

    };

  }



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
            onChange={(e)=>{

              setFrom(e.target.value);

              setActiveRange("");

            }}
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
            onChange={(e)=>{

              setTo(e.target.value);

              setActiveRange("");

            }}
            style={{
              padding:"10px 12px",
              borderRadius:8,
              border:"1px solid #d1d5db"
            }}
          />



          <button
            onClick={applyFilter}
            style={{
              padding:"10px 18px",
              borderRadius:8,
              border:"none",
              background:"#4059d7",
              color:"white",
              cursor:"pointer",
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
            style={buttonStyle(activeRange==="Today")}
            onClick={()=>
              quickRange(0,"Today")
            }
          >
            Today
          </button>



          <button
            style={buttonStyle(activeRange==="7D")}
            onClick={()=>
              quickRange(7,"7D")
            }
          >
            7D
          </button>



          <button
            style={buttonStyle(activeRange==="30D")}
            onClick={()=>
              quickRange(30,"30D")
            }
          >
            30D
          </button>



          <button
            style={buttonStyle(activeRange==="Month")}
            onClick={thisMonth}
          >
            Month
          </button>



          <button
            style={buttonStyle(activeRange==="Last Month")}
            onClick={lastMonth}
          >
            Last Month
          </button>



          <button
            style={buttonStyle(activeRange==="90D")}
            onClick={()=>
              quickRange(90,"90D")
            }
          >
            90D
          </button>



        </div>


      </div>


    </section>

  );

}