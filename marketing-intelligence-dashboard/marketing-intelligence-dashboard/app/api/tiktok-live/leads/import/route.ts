import { NextRequest, NextResponse } from "next/server";

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);

  const headers = lines[0]
    .split(",")
    .map((x) => x.replace(/"/g, "").trim());

  return lines.slice(1).map((line) => {
    const values = line
      .split(",")
      .map((x) => x.replace(/^"|"$/g, "").trim());

    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    return row;
  });
}


async function getExistingPhones() {

  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Supabase missing");
  }


  const response = await fetch(
    `${url}/rest/v1/tiktok_live_leads?select=phone`,
    {
      headers:{
        apikey:key,
      },
      cache:"no-store",
    }
  );


  if(!response.ok){
    throw new Error(await response.text());
  }


  const data = await response.json();


  return new Set(
    data
      .map((item:any)=>item.phone)
      .filter(Boolean)
  );

}



async function insertData(rows:any[]) {

  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;


  if (!url || !key) {
    throw new Error("Supabase missing");
  }


  const response = await fetch(
    `${url}/rest/v1/tiktok_live_leads`,
    {
      method:"POST",
      headers:{
        apikey:key,
        "Content-Type":"application/json",
        Prefer:"return=minimal",
      },
      body:JSON.stringify(rows),
    }
  );


  if(!response.ok){
    throw new Error(await response.text());
  }

}



export async function POST(req: NextRequest) {

  try {

    const form = await req.formData();

    const file = form.get("file") as File;


    if(!file){

      return NextResponse.json(
        {
          error:"No file uploaded"
        },
        {
          status:400
        }
      );

    }



    const text = await file.text();

    const csvRows = parseCSV(text);



    const leads = csvRows.map((row)=>({

      lead_date:
        row["Create Time"] ||
        row["Date"] ||
        new Date()
          .toISOString()
          .slice(0,10),


      name:
        row["Name"] ||
        row["Full Name"] ||
        "",


      phone:
        row["Phone"] ||
        row["Phone Number"] ||
        "",


      email:
        row["Email"] ||
        "",


      city:
        row["City"] ||
        "",


      interested_model:
        row["Model"] ||
        row["Interested Model"] ||
        "",


      source:
        "TikTok Lead Form",


      status:
        "New",

    }));



    const existingPhones =
      await getExistingPhones();



    const newLeads =
      leads.filter(
        (lead:any)=>
          lead.phone &&
          !existingPhones.has(lead.phone)
      );



    const duplicateCount =
      leads.length - newLeads.length;



    if(newLeads.length > 0){

      await insertData(newLeads);

    }



    return NextResponse.json({

      success:true,

      uploaded:
        leads.length,

      inserted:
        newLeads.length,

      duplicate:
        duplicateCount,

    });



  } catch(error:any){

    return NextResponse.json(
      {
        error:error.message
      },
      {
        status:500
      }
    );

  }

}