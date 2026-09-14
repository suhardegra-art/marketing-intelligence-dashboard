"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";


type DailyMetric = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
};


type Props = {
  currentDaily: Record<string, DailyMetric>;
  previousDaily: Record<string, DailyMetric>;

  currentFollowers: Record<string, number>;
  previousFollowers: Record<string, number>;

  from: string;
  to: string;

  previousFrom: string;
  previousTo: string;
};


function formatNumber(value: number) {

  return new Intl.NumberFormat(
    "en-US"
  ).format(value);

}


function formatCompact(value: number) {

  if (Math.abs(value) >= 1000000) {

    return (
      (value / 1000000)
        .toFixed(1)
        .replace(".0", "")
      + "M"
    );

  }


  if (Math.abs(value) >= 1000) {

    return (
      (value / 1000)
        .toFixed(1)
        .replace(".0", "")
      + "K"
    );

  }


  return formatNumber(value);

}


function formatDate(date: string) {

  if (!date) {
    return "-";
  }


  const value =
    new Date(
      `${date}T00:00:00`
    );


  return value.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
    }
  );

}


function getDates(
  from: string,
  to: string
) {

  const result: string[] = [];

  const start =
    new Date(
      `${from}T00:00:00`
    );

  const end =
    new Date(
      `${to}T00:00:00`
    );


  while (
    start.getTime() <=
    end.getTime()
  ) {

    result.push(
      start
        .toISOString()
        .slice(0, 10)
    );


    start.setDate(
      start.getDate() + 1
    );

  }


  return result;

}


function growthRate(
  current: number,
  previous: number
) {

  if (!previous) {
    return null;
  }


  return (
    ((current - previous) /
      previous) *
    100
  );

}


function GrowthBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {

  const growth =
    growthRate(
      current,
      previous
    );


  if (growth === null) {
    return (
      <span
        style={{
          fontSize: 11,
          color: "#9ca3af",
        }}
      >
        No previous data
      </span>
    );
  }


  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color:
          growth >= 0
            ? "#16a34a"
            : "#dc2626",
      }}
    >
      {growth >= 0 ? "↑" : "↓"}{" "}
      {Math.abs(growth).toFixed(1)}%
    </span>
  );

}


function MetricChart({
  data,
  currentKey,
  previousKey,
  valueFormat = "number",
}: {
  data: any[];
  currentKey: string;
  previousKey: string;
  valueFormat?: "number" | "compact";
}) {

  return (
    <div
      style={{
        height: 125,
        marginTop: 12,
      }}
    >

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 4,
            left: 0,
            bottom: 0,
          }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#edf0f7"
          />

          <XAxis
            dataKey="label"
            tick={{
              fontSize: 9,
              fill: "#8b93a7",
            }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            hide
          />

          <Tooltip
            formatter={(value: any) => {

              const number =
                Number(value || 0);

              return [
                valueFormat === "compact"
                  ? formatCompact(number)
                  : formatNumber(number),
                "",
              ];

            }}
          />

          <Line
            type="monotone"
            dataKey={currentKey}
            stroke="#5368e8"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 4,
            }}
          />

          <Line
            type="monotone"
            dataKey={previousKey}
            stroke="#c9cef0"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 3,
            }}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );

}


export default function TikTokGrowthComparison({
  currentDaily,
  previousDaily,
  currentFollowers,
  previousFollowers,
  from,
  to,
  previousFrom,
  previousTo,
}: Props) {


  const dates =
    useMemo(
      () =>
        getDates(
          from,
          to
        ),
      [from, to]
    );


  const previousDates =
    useMemo(
      () =>
        getDates(
          previousFrom,
          previousTo
        ),
      [
        previousFrom,
        previousTo,
      ]
    );


  const chartData =
    useMemo(() => {

      return dates.map(
        (
          date,
          index
        ) => {

          const previousDate =
            previousDates[index];


          const current =
            currentDaily[date] || {
              views: 0,
              likes: 0,
              comments: 0,
              shares: 0,
            };


          const previous =
            previousDaily[
              previousDate
            ] || {
              views: 0,
              likes: 0,
              comments: 0,
              shares: 0,
            };


          return {

            label:
              formatDate(date),

            currentViews:
              current.views,

            previousViews:
              previous.views,

            currentLikes:
              current.likes,

            previousLikes:
              previous.likes,

            currentCommentsShares:
              current.comments +
              current.shares,

            previousCommentsShares:
              previous.comments +
              previous.shares,

            currentFollowers:
              currentFollowers[date] || 0,

            previousFollowers:
              previousFollowers[
                previousDate
              ] || 0,

          };

        }
      );

    }, [
      dates,
      previousDates,
      currentDaily,
      previousDaily,
      currentFollowers,
      previousFollowers,
    ]);




  const totalViews =
    dates.reduce(
      (
        sum,
        date
      ) =>
        sum +
        Number(
          currentDaily[date]
            ?.views || 0
        ),
      0
    );


  const previousTotalViews =
    previousDates.reduce(
      (
        sum,
        date
      ) =>
        sum +
        Number(
          previousDaily[date]
            ?.views || 0
        ),
      0
    );



  const totalLikes =
    dates.reduce(
      (
        sum,
        date
      ) =>
        sum +
        Number(
          currentDaily[date]
            ?.likes || 0
        ),
      0
    );


  const previousTotalLikes =
    previousDates.reduce(
      (
        sum,
        date
      ) =>
        sum +
        Number(
          previousDaily[date]
            ?.likes || 0
        ),
      0
    );



  const totalCommentsShares =
    dates.reduce(
      (
        sum,
        date
      ) => {

        const row =
          currentDaily[date];

        return (
          sum +
          Number(
            row?.comments || 0
          ) +
          Number(
            row?.shares || 0
          )
        );

      },
      0
    );


  const previousCommentsShares =
    previousDates.reduce(
      (
        sum,
        date
      ) => {

        const row =
          previousDaily[date];

        return (
          sum +
          Number(
            row?.comments || 0
          ) +
          Number(
            row?.shares || 0
          )
        );

      },
      0
    );



  const firstFollower =
    dates.length > 0
      ? Number(
          currentFollowers[
            dates[0]
          ] || 0
        )
      : 0;


  const lastFollower =
    dates.length > 0
      ? Number(
          currentFollowers[
            dates[
              dates.length - 1
            ]
          ] || 0
        )
      : 0;


  const previousFirstFollower =
    previousDates.length > 0
      ? Number(
          previousFollowers[
            previousDates[0]
          ] || 0
        )
      : 0;


  const previousLastFollower =
    previousDates.length > 0
      ? Number(
          previousFollowers[
            previousDates[
              previousDates.length - 1
            ]
          ] || 0
        )
      : 0;



  const newFollowers =
    Math.max(
      0,
      lastFollower -
      firstFollower
    );


  const previousNewFollowers =
    Math.max(
      0,
      previousLastFollower -
      previousFirstFollower
    );



  const followerGrowth =
    firstFollower > 0
      ? (
          (
            lastFollower -
            firstFollower
          )
          /
          firstFollower
        ) * 100
      : 0;


  const previousFollowerGrowth =
    previousFirstFollower > 0
      ? (
          (
            previousLastFollower -
            previousFirstFollower
          )
          /
          previousFirstFollower
        ) * 100
      : 0;



  const cards = [

    {
      title:
        "Follower Growth",

      value:
        followerGrowth,

      previous:
        previousFollowerGrowth,

      type:
        "percentage",

      currentLabel:
        `${formatCompact(lastFollower)} followers`,

      previousLabel:
        `${formatCompact(previousLastFollower)} followers`,

      dataKey:
        "currentFollowers",

      previousKey:
        "previousFollowers",

    },

    {
      title:
        "Views",

      value:
        totalViews,

      previous:
        previousTotalViews,

      type:
        "number",

      dataKey:
        "currentViews",

      previousKey:
        "previousViews",

    },

    {
      title:
        "Likes",

      value:
        totalLikes,

      previous:
        previousTotalLikes,

      type:
        "number",

      dataKey:
        "currentLikes",

      previousKey:
        "previousLikes",

    },

    {
      title:
        "Comments & Shares",

      value:
        totalCommentsShares,

      previous:
        previousCommentsShares,

      type:
        "number",

      dataKey:
        "currentCommentsShares",

      previousKey:
        "previousCommentsShares",

    },

    {
      title:
        "New Followers",

      value:
        newFollowers,

      previous:
        previousNewFollowers,

      type:
        "number",

      dataKey:
        "currentFollowers",

      previousKey:
        "previousFollowers",

    },

  ];



  return (

    <section
      className="panel"
      style={{
        marginTop: 16,
        padding: 16,
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom: 16,
          gap: 12,
        }}
      >

        <div>

          <h3
            style={{
              margin: 0,
              fontSize: 18,
            }}
          >
            TikTok Growth Comparison
          </h3>

          <p
            style={{
              margin:
                "4px 0 0",
              color:
                "#8b93a7",
              fontSize: 12,
            }}
          >
            Selected date range compared automatically with the previous period of equal length.
          </p>

        </div>


        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#667085",
            background: "#f7f8fc",
            border:
              "1px solid #e5e7ef",
            borderRadius: 10,
            padding:
              "8px 12px",
            whiteSpace:
              "nowrap",
          }}
        >
          {formatDate(from)}
          {" – "}
          {formatDate(to)}
          {" vs "}
          {formatDate(previousFrom)}
          {" – "}
          {formatDate(previousTo)}
        </div>

      </div>



      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5,minmax(0,1fr))",
          gap: 12,
        }}
      >

        {cards.map(
          (card) => (

            <div
              key={card.title}
              style={{
                background: "#fff",
                border:
                  "1px solid #edf0f7",
                borderRadius: 14,
                padding: 14,
                minWidth: 0,
              }}
            >

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#344054",
                }}
              >
                {card.title}
              </div>


              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >

                <strong
                  style={{
                    fontSize: 24,
                    color: "#17213d",
                  }}
                >

                  {
                    card.type ===
                    "percentage"

                      ? `${card.value >= 0 ? "+" : ""}${card.value.toFixed(1)}%`

                      : `+${formatCompact(
                          card.value
                        )}`

                  }

                </strong>


                <GrowthBadge
                  current={
                    card.value
                  }
                  previous={
                    card.previous
                  }
                />

              </div>


              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 6,
                  fontSize: 10,
                  color: "#8b93a7",
                }}
              >

                <span>
                  <span
                    style={{
                      display:
                        "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius:
                        "50%",
                      background:
                        "#5368e8",
                      marginRight: 4,
                    }}
                  />

                  Current

                </span>


                <span>
                  <span
                    style={{
                      display:
                        "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius:
                        "50%",
                      background:
                        "#c9cef0",
                      marginRight: 4,
                    }}
                  />

                  Previous

                </span>

              </div>


              <MetricChart
                data={chartData}
                currentKey={
                  card.dataKey
                }
                previousKey={
                  card.previousKey
                }
                valueFormat={
                  card.type ===
                  "percentage"
                    ? "number"
                    : "compact"
                }
              />


            </div>

          )
        )}

      </div>


    </section>

  );

}