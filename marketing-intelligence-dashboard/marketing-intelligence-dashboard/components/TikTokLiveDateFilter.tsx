"use client";

import { useRouter, useSearchParams } from "next/navigation";


export default function TikTokLiveDateFilter(){

  const router = useRouter();

  const params = useSearchParams();


  function setRange(days:number){

    const to =
      new Date();


    const from =
      new Date();

    from.setDate(
      to.getDate() - days
    );


    const fromDate =
      from.toISOString()
      .slice(0,10);


    const toDate =
      to.toISOString()
      .slice(0,10);


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

      <div
        style={{
          display:"flex",
          gap:10
        }}
      >

        <button
          onClick={()=>setRange(7)}
        >
          Last 7 Days
        </button>


        <button
          onClick={()=>setRange(30)}
        >
          Last 30 Days
        </button>


        <button
          onClick={()=>setRange(90)}
        >
          Last 3 Months
        </button>


      </div>

    </section>

  );

}