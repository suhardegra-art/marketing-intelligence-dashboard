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

function formatDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function TikTokLiveLeadTable({
  data,
}: {
  data: Lead[];
}) {

  return (
    <section className="panel" style={{ marginTop: 16 }}>

      <div className="panel-header">
        <div>
          <h3>TikTok Lead Form Data</h3>
          <p>
            Leads collected from TikTok Form
          </p>
        </div>

        <button
          style={{
            padding:"8px 14px",
            borderRadius:8,
            border:"none",
            cursor:"pointer"
          }}
        >
          Download CSV
        </button>
      </div>


      <div style={{overflowX:"auto"}}>

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

          {data.map((lead,index)=>(
            <tr key={index}>

              <td>
                {formatDate(lead.lead_date)}
              </td>

              <td>
                {lead.name}
              </td>

              <td>
                {lead.phone}
              </td>

              <td>
                {lead.email}
              </td>

              <td>
                {lead.city}
              </td>

              <td>
                {lead.interested_model}
              </td>

              <td>
                {lead.source}
              </td>

              <td>
                {lead.status}
              </td>

            </tr>
          ))}

          </tbody>

        </table>

      </div>

    </section>
  );
}