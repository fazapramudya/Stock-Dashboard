document.addEventListener("DOMContentLoaded", () => {
  const tickers = ["MSTR", "GOOGL", "AMZN"];
  const REFRESH_INTERVAL = 300000; // Refresh data API setiap 5 menit

  const formatLargeNumber = (num, isCurrency = false) => {
    if (num === null || typeof num === "undefined" || typeof num !== "number")
      return "N/A";
    const prefix = isCurrency ? "$" : "";
    if (Math.abs(num) >= 1_000_000_000_000)
      return `${prefix}${(num / 1_000_000_000_000).toFixed(2)}T`;
    if (Math.abs(num) >= 1_000_000_000)
      return `${prefix}${(num / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(num) >= 1_000_000)
      return `${prefix}${(num / 1_000_000).toFixed(2)}M`;
    return `${prefix}${num.toLocaleString()}`;
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

  const fetchKeyMetrics = async (ticker) => {
    // PERBAIKAN UTAMA: URL sekarang sangat sederhana berkat netlify.toml
    const apiUrl = `/api/v10/finance/quoteSummary/${ticker}?modules=price,summaryDetail,defaultKeyStatistics`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok)
        throw new Error(`Network error: ${response.statusText}`);

      const data = await response.json();
      if (data.quoteSummary.error)
        throw new Error(data.quoteSummary.error.description);

      updateUIMetrics(ticker, data.quoteSummary.result[0]);
    } catch (error) {
      console.error(`Gagal mengambil metrik untuk ${ticker}:`, error);
      const priceEl = document.getElementById(`${ticker.toLowerCase()}-price`);
      if (priceEl) priceEl.innerHTML = `Gagal Memuat.`;
    }
  };

  // Fungsi updateUIMetrics tidak berubah
  const updateUIMetrics = (ticker, data) => {
    const tickerId = ticker.toLowerCase();
    const price = data.price;
    const summary = data.summaryDetail;
    const stats = data.defaultKeyStatistics;

    const change = price.regularMarketChange?.raw ?? 0;
    const changePercent = (price.regularMarketChangePercent?.raw ?? 0) * 100;
    const priceEl = document.getElementById(`${tickerId}-price`);
    priceEl.innerHTML = `$${(price.regularMarketPrice?.raw ?? 0).toFixed(
      2
    )} <small class="${change >= 0 ? "positive" : "negative"}">${
      change >= 0 ? "+" : ""
    }${change.toFixed(2)} (${change >= 0 ? "+" : ""}${changePercent.toFixed(
      2
    )}%)</small>`;

    document.getElementById(`${tickerId}-marketCap`).textContent =
      formatLargeNumber(price.marketCap?.raw, true);
    document.getElementById(`${tickerId}-enterpriseValue`).textContent =
      formatLargeNumber(stats.enterpriseValue?.raw, true);

    const high = summary.fiftyTwoWeekHigh?.raw;
    const low = summary.fiftyTwoWeekLow?.raw;
    const returnEl = document.getElementById(`${tickerId}-1yReturn`);
    if (typeof high === "number" && typeof low === "number" && low !== 0) {
      const return1yPercent = ((high - low) / low) * 100;
      returnEl.textContent = `${
        return1yPercent >= 0 ? "+" : ""
      }${return1yPercent.toFixed(2)}%`;
      returnEl.className = `metric-value ${
        return1yPercent >= 0 ? "positive" : "negative"
      }`;
    } else {
      returnEl.textContent = "N/A";
    }

    document.getElementById(`${tickerId}-peRatio`).textContent =
      summary.trailingPE?.fmt || "N/A";
    document.getElementById(`${tickerId}-eps`).textContent =
      stats.trailingEps?.fmt || "N/A";
    document.getElementById(`${tickerId}-volume`).textContent =
      formatLargeNumber(price.regularMarketVolume?.raw);
    document.getElementById(`${tickerId}-avgVolume`).textContent =
      formatLargeNumber(summary.averageVolume?.raw);
  };

  const init = () => {
    tickers.forEach((ticker) => {
      loadTradingViewWidget(ticker);
      fetchKeyMetrics(ticker);
      setInterval(() => fetchKeyMetrics(ticker), REFRESH_INTERVAL);
    });
  };

  init();
});
