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



  function applyFilter(){

    if(!from || !to) return;


    router.push(
      `/tiktok-live?from=${from}&to=${to}`
    );

  }



  function quickRange(days:number){

    const today =
      new Date();


    const start =
      new Date();


    start.setDate(
      today.getDate() - days
    );


    const fromDate =
      start
      .toISOString()
      .slice(0,10);


    const toDate =
      today
      .toISOString()
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
      first
      .toISOString()
      .slice(0,10);


    const toDate =
      date
      .toISOString()
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
      first
      .toISOString()
      .slice(0,10);


    const toDate =
      last
      .toISOString()
      .slice(0,10);



    setFrom(fromDate);
    setTo(toDate);


    router.push(
      `/tiktok-live?from=${fromDate}&to=${toDate}`
    );

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
          gap:10,
          alignItems:"center",
          flexWrap:"wrap"
        }}
      >

        <input
          type="date"
          value={from}
          onChange={(e)=>
            setFrom(e.target.value)
          }
          style={{
            padding:10,
            borderRadius:8
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
            padding:10,
            borderRadius:8
          }}
        />


        <button
          onClick={applyFilter}
        >
          Apply
        </button>

      </div>



      <div
        style={{
          marginTop:14,
          display:"flex",
          gap:8,
          flexWrap:"wrap"
        }}
      >

        <button onClick={()=>quickRange(0)}>
          Today
        </button>


        <button onClick={()=>quickRange(7)}>
          Last 7 Days
        </button>


        <button onClick={()=>quickRange(30)}>
          Last 30 Days
        </button>


        <button onClick={thisMonth}>
          This Month
        </button>


        <button onClick={lastMonth}>
          Last Month
        </button>


        <button onClick={()=>quickRange(90)}>
          Last 90 Days
        </button>


      </div>


    </section>

  );

}