document.addEventListener("DOMContentLoaded", () => {
  const tickers = ["MSTR", "GOOGL", "AMZN"];
  const REFRESH_INTERVAL = 300000;

  // ===================================================================
  // == GANTI DENGAN URL CSV ANDA DARI GOOGLE SHEETS DI SINI ==
  const GOOGLE_SHEET_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTSPSL8ZJZNqkO1fM5FFl2FOk2QSXF7uOnZdHtTnTPIZ1KSAdjnP1Cs8iZ6NkoF6P71JKjSosX2Zi4n/pub?output=csv";
  // ===================================================================

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
      console.log("Mencoba mengambil data dari:", GOOGLE_SHEET_CSV_URL);
      const response = await fetch(GOOGLE_SHEET_CSV_URL);
      if (!response.ok)
        throw new Error(`Network response was not ok (${response.status})`);

      const csvText = await response.text();
      console.log("--- Teks CSV Mentah Diterima ---");
      console.log(csvText);

      const rows = csvText.trim().split("\n");
      const headers = rows
        .shift()
        .split(",")
        .map((h) => h.trim().toLowerCase());

      console.log("--- Header yang Diproses ---");
      console.log(headers);

      rows.forEach((row, index) => {
        const values = row.split(",").map((v) => v.trim());
        if (values.length < headers.length || values.every((v) => v === ""))
          return;

        const stockData = {};
        headers.forEach((header, hIndex) => {
          stockData[header] = values[hIndex];
        });

        if (index === 0) {
          // Cetak hanya objek data pertama untuk debugging
          console.log(
            "--- Contoh Objek Data yang Diproses (Baris Pertama) ---"
          );
          console.log(stockData);
        }

        const tickerKey = headers[0];
        if (tickers.includes(stockData[tickerKey].toUpperCase())) {
          console.log(
            `Menemukan dan memperbarui data untuk: ${stockData[
              tickerKey
            ].toUpperCase()}`
          );
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

    const price = parseFloat(getData("price")) || 0;
    const change = parseFloat(getData("change")) || 0;
    const changePercent = parseFloat(getData("changepercent")) || 0;

    const priceEl = document.getElementById(`${tickerId}-price`);
    priceEl.innerHTML = `$${price.toFixed(2)} <small class="${
      change >= 0 ? "positive" : "negative"
    }">${change >= 0 ? "+" : ""}${change.toFixed(2)} (${
      change >= 0 ? "+" : ""
    }${changePercent.toFixed(2)}%)</small>`;

    document.getElementById(`${tickerId}-marketcap`).textContent =
      formatLargeNumber(getData("marketcap"), true);
    document.getElementById(`${tickerId}-enterprisevalue`).textContent =
      formatLargeNumber(getData("enterprisevalue"), true);

    const returnEl = document.getElementById(`${tickerId}-1yreturn`);
    const return1y = parseFloat(getData("return1y"));
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

    document.getElementById(`${tickerId}-peratio`).textContent =
      getData("peratio") || "N/A";
    document.getElementById(`${tickerId}-eps`).textContent =
      getData("eps") || "N/A";
    document.getElementById(`${tickerId}-volume`).textContent =
      formatLargeNumber(getData("volume"));
    document.getElementById(`${tickerId}-avgvolume`).textContent =
      formatLargeNumber(getData("avgvolume"));
  };

  const init = () => {
    tickers.forEach((ticker) => loadTradingViewWidget(ticker));
    fetchKeyMetrics();
    setInterval(fetchKeyMetrics, REFRESH_INTERVAL);
  };

  init();
});
