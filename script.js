document.addEventListener("DOMContentLoaded", () => {
  // ===================================================================
  // == GANTI DENGAN URL CSV BARU ANDA DARI GOOGLE SHEETS DI SINI ==
  const GOOGLE_SHEET_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTSPSL8ZJZNqkO1fM5FFl2FOk2QSXF7uOnZdHtTnTPIZ1KSAdjnP1Cs8iZ6NkoF6P71JKjSosX2Zi4n/pub?output=csv";
  // ===================================================================

  const rawDataOutput = document.getElementById("raw-data-output");

  const fetchRawData = async () => {
    if (
      !GOOGLE_SHEET_CSV_URL ||
      GOOGLE_SHEET_CSV_URL === "URL_CSV_BARU_ANDA_YANG_SUDAH_DIPUBLIKASIKAN"
    ) {
      const errorMsg = "URL Google Sheet CSV belum diatur di script.js";
      console.error(errorMsg);
      rawDataOutput.textContent = errorMsg;
      return;
    }

    try {
      const response = await fetch(GOOGLE_SHEET_CSV_URL);
      if (!response.ok) {
        throw new Error(`Gagal mengambil data. Status: ${response.status}`);
      }

      const csvText = await response.text();

      // Tampilkan data mentah di console DAN di halaman web
      console.log("--- DATA MENTAH CSV ---");
      console.log(csvText);
      rawDataOutput.textContent = csvText;
    } catch (error) {
      console.error("Gagal mengambil data dari Google Sheet:", error);
      rawDataOutput.textContent = `Error: ${error.message}`;
    }
  };
  const formatLargeNumber = (num, isCurrency = false) => {
    const parsedNum = parseFloat(num);
    if (isNaN(parsedNum)) return "N/A";
    const prefix = isCurrency ? "$" : "";
    if (Math.abs(parsedNum) >= 1_000_000_000_000)
      return `${prefix}${(parsedNum / 1_000_000_000_000).toFixed(2)}T`;
    if (Math.abs(parsedNum) >= 1_000_000_000)
      return `${prefix}${(parsedNum / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(parsedNum) >= 1_000_000)
      return `${prefix}${(parsedNum / 1_000_000).toFixed(2)}M`;
    return `${prefix}${parsedNum.toLocaleString()}`;
  };

  const loadTradingViewWidget = (ticker) => {
    const containerId = `tv-widget-${ticker.toLowerCase()}`;
    if (document.getElementById(containerId)) {
      new TradingView.widget({
        container_id: containerId,
        autosize: true,
        symbol: `NASDAQ:${ticker}`,
        interval: "D",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: true,
      });
    }
  };

  const fetchKeyMetrics = async () => {
    if (
      !GOOGLE_SHEET_CSV_URL ||
      GOOGLE_SHEET_CSV_URL === "URL_CSV_ANDA_YANG_SUDAH_DIPUBLIKASIKAN"
    ) {
      console.error("URL Google Sheet CSV belum diatur di script.js");
      return;
    }

    try {
      const response = await fetch(GOOGLE_SHEET_CSV_URL);
      if (!response.ok)
        throw new Error(`Network response was not ok (${response.status})`);

      const csvText = await response.text();
      const rows = csvText.trim().split("\n");
      const headers = rows
        .shift()
        .split(",")
        .map((h) => h.trim().toLowerCase());

      rows.forEach((row) => {
        const values = row.split(",").map((v) => v.trim());
        if (values.length < headers.length || values.every((v) => v === ""))
          return;

        const stockData = {};
        headers.forEach((header, index) => {
          stockData[header] = values[index];
        });

        const tickerKey = headers[0]; // Asumsikan 'ticker' adalah header pertama
        if (tickers.includes(stockData[tickerKey].toUpperCase())) {
          updateUIMetrics(stockData[tickerKey].toUpperCase(), stockData);
        }
      });
    } catch (error) {
      console.error(
        "Gagal mengambil atau memproses data dari Google Sheet:",
        error
      );
    }
  };

  const updateUIMetrics = (ticker, data) => {
    const tickerId = ticker.toLowerCase();
    const getData = (key) => data[key.toLowerCase()];

    const price = parseFloat(getData("Price")) || 0;
    const change = parseFloat(getData("Change")) || 0;
    const changePercent = parseFloat(getData("ChangePercent")) || 0;

    const priceEl = document.getElementById(`${tickerId}-price`);
    priceEl.innerHTML = `$${price.toFixed(2)} <small class="${
      change >= 0 ? "positive" : "negative"
    }">${change >= 0 ? "+" : ""}${change.toFixed(2)} (${
      change >= 0 ? "+" : ""
    }${changePercent.toFixed(2)}%)</small>`;

    document.getElementById(`${tickerId}-marketCap`).textContent =
      formatLargeNumber(getData("MarketCap"), true);
    document.getElementById(`${tickerId}-enterpriseValue`).textContent =
      formatLargeNumber(getData("EnterpriseValue"), true);

    const returnEl = document.getElementById(`${tickerId}-1yReturn`);
    const return1y = parseFloat(getData("Return1Y"));
    if (!isNaN(return1y)) {
      returnEl.textContent = `${return1y >= 0 ? "+" : ""}${return1y.toFixed(
        2
      )}%`;
      returnEl.className = `metric-value ${
        return1y >= 0 ? "positive" : "negative"
      }`;
    } else {
      returnEl.textContent = "N/A";
    }

    document.getElementById(`${tickerId}-peRatio`).textContent =
      getData("PERatio") || "N/A";
    document.getElementById(`${tickerId}-eps`).textContent =
      getData("EPS") || "N/A";
    document.getElementById(`${tickerId}-volume`).textContent =
      formatLargeNumber(getData("Volume"));
    document.getElementById(`${tickerId}-avgVolume`).textContent =
      formatLargeNumber(getData("AvgVolume"));
  };

  const init = () => {
    tickers.forEach((ticker) => loadTradingViewWidget(ticker));
    fetchKeyMetrics();
    setInterval(fetchKeyMetrics, REFRESH_INTERVAL);
  };
  fetchRawData();
  init();
});
