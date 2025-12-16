document.addEventListener("DOMContentLoaded", () => {
  const tickers = ["MSTR",  "AMZN"];
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

    // Bagian ini sudah benar
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
    document.getElementById(`${tickerId}-peratio`).textContent =
      getData("peratio") || "N/A";
    document.getElementById(`${tickerId}-eps`).textContent =
      getData("eps") || "N/A";
    document.getElementById(`${tickerId}-volume`).textContent =
      formatLargeNumber(getData("volume"));
    document.getElementById(`${tickerId}-avgvolume`).textContent =
      formatLargeNumber(getData("avgvolume"));

    // --- PERBAIKAN DI SINI ---

    // 1. Ubah Total Owned menjadi angka saja (bukan mata uang)
    // Cukup panggil formatLargeNumber tanpa parameter kedua (atau set ke false)
    document.getElementById(`${tickerId}-totalowned`).textContent =
      formatLargeNumber(getData("totalowned"));

    // 2. Ubah Balance menjadi format mata uang
    const balanceEl = document.getElementById(`${tickerId}-balance`);
    const balanceValue = parseFloat(getData("balance"));
    if (!isNaN(balanceValue)) {
      // Gunakan formatLargeNumber dengan isCurrency = true
      balanceEl.textContent = formatLargeNumber(balanceValue, true);
      // Atur warna berdasarkan nilainya (positif atau negatif)
      balanceEl.className = `metric-value ${
        balanceValue >= 0 ? "positive" : "negative"
      }`;
    } else {
      balanceEl.textContent = "N/A";
    }
  };

  const init = () => {
    tickers.forEach((ticker) => loadTradingViewWidget(ticker));
    fetchKeyMetrics();
    setInterval(fetchKeyMetrics, REFRESH_INTERVAL);
  };

  const tabs = document.querySelectorAll(".nav-tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Hapus kelas 'active' dari semua tombol dan konten
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Tambahkan kelas 'active' ke tombol yang diklik
      tab.classList.add("active");

      // Tampilkan konten yang sesuai
      const targetTab = tab.getAttribute("data-tab");
      document.getElementById(targetTab).classList.add("active");
    });
  });

  init();
});
