document.addEventListener("DOMContentLoaded", () => {
  const tickers = ["MSTR", "GOOGL", "AMZN"];
  const REFRESH_INTERVAL = 300000;
  // URL sekarang sangat sederhana berkat netlify.toml
  const GOOGLE_SHEET_API_URL = "/api/";

  const formatLargeNumber = (num, isCurrency = false) => {
    /* ... (fungsi tetap sama) ... */
  };
  const loadTradingViewWidget = (ticker) => {
    /* ... (fungsi tetap sama) ... */
  };

  const fetchKeyMetrics = async () => {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL);
      if (!response.ok) throw new Error(`Network error`);
      const allData = await response.json();

      for (const ticker in allData) {
        if (allData.hasOwnProperty(ticker)) {
          updateUIMetrics(ticker, allData[ticker]);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      tickers.forEach((ticker) => {
        const priceEl = document.getElementById(
          `${ticker.toLowerCase()}-price`
        );
        if (priceEl) priceEl.textContent = "Gagal Muat";
      });
    }
  };

  const updateUIMetrics = (ticker, data) => {
    /* ... (fungsi tetap sama) ... */
  };

  const init = () => {
    tickers.forEach((ticker) => loadTradingViewWidget(ticker));
    fetchKeyMetrics();
    setInterval(fetchKeyMetrics, REFRESH_INTERVAL);
  };

  init();
});
