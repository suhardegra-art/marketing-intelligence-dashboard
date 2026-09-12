"use client";

import { useMemo, useState } from "react";

type Lead = {
  lead_date: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  interested_model: string;
  source: string;
  status: string;
};

const PAGE_SIZE = 50;

function formatDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCSV(data: Lead[]) {
  const header = [
    "Date",
    "Name",
    "Phone",
    "Email",
    "City",
    "Model",
    "Source",
    "Status",
  ];

  const rows = data.map((lead) => [
    lead.lead_date,
    lead.name,
    lead.phone,
    lead.email,
    lead.city,
    lead.interested_model,
    lead.source,
    lead.status,
  ]);

  return [header, ...rows]
    .map((row) =>
      row
        .map((item) =>
          `"${String(item ?? "").replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\n");
}

export default function TikTokLiveLeadTable({
  data,
}: {
  data: Lead[];
}) {

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [page, setPage] = useState(1);


  const filteredData = useMemo(() => {
    return data.filter((lead) => {

      const keyword =
        search.toLowerCase();

      const matchSearch =
        !keyword ||
        lead.name?.toLowerCase().includes(keyword) ||
        lead.phone?.toLowerCase().includes(keyword) ||
        lead.city?.toLowerCase().includes(keyword) ||
        lead.interested_model?.toLowerCase().includes(keyword);


      const matchStatus =
        status === "All" ||
        lead.status === status;


      return matchSearch && matchStatus;

    });
  }, [data, search, status]);


  const totalPages =
    Math.max(
      1,
      Math.ceil(filteredData.length / PAGE_SIZE)
    );


  const currentData =
    filteredData.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE
    );


  function downloadCSV() {

    const csv = formatCSV(filteredData);

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "tiktok-lead-form-data.csv";

    link.click();

    URL.revokeObjectURL(url);
  }


  return (
    <section
      className="panel"
      style={{
        marginTop: 16
      }}
    >

      <div className="panel-header">

        <div>
          <h3>
            TikTok Lead Form Data
          </h3>

          <p>
            Leads collected from TikTok Form
          </p>
        </div>


        <button
          onClick={downloadCSV}
          style={{
            padding:"8px 14px",
            borderRadius:8,
            border:"none",
            cursor:"pointer",
            background:"#4059d7",
            color:"white",
            fontWeight:700
          }}
        >
          Download CSV
        </button>

      </div>


      <div
        style={{
          display:"flex",
          gap:12,
          marginBottom:16
        }}
      >

        <input
          placeholder="Search name, phone, city, model..."
          value={search}
          onChange={(e)=>{
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex:1,
            padding:"10px",
            borderRadius:8,
            border:"1px solid #ddd"
          }}
        />


        <select
          value={status}
          onChange={(e)=>{
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{
            padding:"10px",
            borderRadius:8,
            border:"1px solid #ddd"
          }}
        >
          {[
            "All",
            "New",
            "Contacted",
            "Follow Up",
            "Qualified",
            "SPK",
            "Lost",
          ].map((item)=>(
            <option key={item}>
              {item}
            </option>
          ))}
        </select>

      </div>


      <div
        style={{
          overflowX:"auto"
        }}
      >

        <table
          style={{
            width:"100%",
            borderCollapse:"collapse"
          }}
        >

          <thead>

            <tr>

              {[
                "Date",
                "Name",
                "Phone",
                "Email",
                "City",
                "Model",
                "Source",
                "Status"
              ].map((item)=>(
                <th
                  key={item}
                  style={{
                    textAlign:"left",
                    padding:"12px",
                    fontSize:12
                  }}
                >
                  {item}
                </th>
              ))}

            </tr>

          </thead>


          <tbody>

            {currentData.map((lead,index)=>(

              <tr key={index}>

                <td>{formatDate(lead.lead_date)}</td>

                <td>{lead.name}</td>

                <td>{lead.phone}</td>

                <td>{lead.email}</td>

                <td>{lead.city}</td>

                <td>{lead.interested_model}</td>

                <td>{lead.source}</td>

                <td>{lead.status}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>


      <div
        style={{
          display:"flex",
          justifyContent:"space-between",
          marginTop:16,
          alignItems:"center"
        }}
      >

        <span
          style={{
            fontSize:12,
            color:"#777"
          }}
        >
          Showing {currentData.length} of {filteredData.length} leads
        </span>


        <div>

          <button
            disabled={page===1}
            onClick={()=>setPage(page-1)}
          >
            Previous
          </button>

          <span
            style={{
              margin:"0 12px"
            }}
          >
            {page} / {totalPages}
          </span>

          <button
            disabled={page===totalPages}
            onClick={()=>setPage(page+1)}
          >
            Next
          </button>

        </div>

      </div>


    </section>
  );
}