"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TikTokLeadUpload() {

  const router = useRouter();

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function upload(file: File) {

    setLoading(true);
    setResult(null);
    setError("");


    try {

      const formData = new FormData();

      formData.append(
        "file",
        file
      );


      const response = await fetch(
        "/api/tiktok-live/leads/import",
        {
          method:"POST",
          body:formData,
        }
      );


      const data =
        await response.json();


      if(!response.ok){

        throw new Error(
          data.error || "Upload failed"
        );

      }


      setResult(data);


      if(data.success){

        router.refresh();

      }


    } catch(err:any){

      setError(
        err.message
      );

    } finally {

      setLoading(false);

    }

  }



  return (

    <div>

      <label
        style={{
          display:"inline-flex",
          padding:"8px 14px",
          background:"#4059d7",
          color:"white",
          borderRadius:8,
          cursor:"pointer",
          fontWeight:700,
          fontSize:12,
        }}
      >

        {loading
          ? "Uploading..."
          : "Upload Lead CSV"
        }


        <input
          type="file"
          accept=".csv"
          hidden

          disabled={loading}

          onChange={(e)=>{

            const file =
              e.target.files?.[0];

            if(file){

              upload(file);

            }

          }}
        />

      </label>


      {error && (

        <div
          style={{
            marginTop:12,
            padding:12,
            borderRadius:10,
            background:"#fff1f2",
            border:"1px solid #fecdd3",
            color:"#be123c",
            fontSize:12,
          }}
        >

          ❌ {error}

        </div>

      )}



      {result && (

        <div
          style={{
            marginTop:12,
            padding:12,
            borderRadius:10,
            background:"#f8f9ff",
            border:"1px solid #e2e5f5",
            fontSize:12,
          }}
        >

          <strong>
            Import Result
          </strong>


          <p>
            Total Uploaded:
            {" "}
            {result.uploaded || 0}
          </p>


          <p
            style={{
              color:"#16a34a"
            }}
          >
            ✅ New Leads Added:
            {" "}
            {result.inserted || 0}
          </p>


          <p
            style={{
              color:"#d97706"
            }}
          >
            ⚠ Duplicate Skipped:
            {" "}
            {result.duplicate || 0}
          </p>


        </div>

      )}

    </div>

  );
}