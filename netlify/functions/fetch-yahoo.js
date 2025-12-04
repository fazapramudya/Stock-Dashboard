// File: netlify/functions/fetch-yahoo.js
const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  const ticker = event.queryStringParameters.ticker;
  if (!ticker) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Ticker is required" }),
    };
  }

  const YFINANCE_URL = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=price,summaryDetail,defaultKeyStatistics`;

  try {
    const response = await fetch(YFINANCE_URL);
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch data" }),
    };
  }
};
