document.addEventListener("DOMContentLoaded", () => {
  const tickers = ["MSTR", "GOOGL", "AMZN"];

  // --- DATA DUMMY DIMULAI DI SINI ---
  const dummyData = {
    MSTR: {
      price: 188.39,
      change: 7.06,
      changePercent: 3.89,
      marketCap: 55700000000,
      enterpriseValue: 70282000000,
      return1yPercent: -50.12,
      peRatio: "31.45",
      eps: "5.99",
      volume: 2600000,
      avgVolume: 3100000,
    },
    GOOGL: {
      price: 319.63,
      change: 3.82,
      changePercent: 1.21,
      marketCap: 2150000000000,
      enterpriseValue: 2130000000000,
      return1yPercent: 25.8,
      peRatio: "28.70",
      eps: "11.14",
      volume: 18500000,
      avgVolume: 22000000,
    },
    AMZN: {
      price: 232.38,
      change: -2.04,
      changePercent: -0.87,
      marketCap: 1980000000000,
      enterpriseValue: 2050000000000,
      return1yPercent: 45.33,
      peRatio: "55.60",
      eps: "4.18",
      volume: 45000000,
      avgVolume: 51000000,
    },
  };
  // --- DATA DUMMY SELESAI ---

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

  const updateUIMetrics = (ticker, data) => {
    const tickerId = ticker.toLowerCase();

    const change = data.change;
    const changePercent = data.changePercent;
    const priceEl = document.getElementById(`${tickerId}-price`);
    priceEl.innerHTML = `$${data.price.toFixed(2)} <small class="${
      change >= 0 ? "positive" : "negative"
    }">${change >= 0 ? "+" : ""}${change.toFixed(2)} (${
      change >= 0 ? "+" : ""
    }${changePercent.toFixed(2)}%)</small>`;

    document.getElementById(`${tickerId}-marketCap`).textContent =
      formatLargeNumber(data.marketCap, true);
    document.getElementById(`${tickerId}-enterpriseValue`).textContent =
      formatLargeNumber(data.enterpriseValue, true);

    const returnEl = document.getElementById(`${tickerId}-1yReturn`);
    returnEl.textContent = `${
      data.return1yPercent >= 0 ? "+" : ""
    }${data.return1yPercent.toFixed(2)}%`;
    returnEl.className = `metric-value ${
      data.return1yPercent >= 0 ? "positive" : "negative"
    }`;

    document.getElementById(`${tickerId}-peRatio`).textContent = data.peRatio;
    document.getElementById(`${tickerId}-eps`).textContent = data.eps;
    document.getElementById(`${tickerId}-volume`).textContent =
      formatLargeNumber(data.volume);
    document.getElementById(`${tickerId}-avgVolume`).textContent =
      formatLargeNumber(data.avgVolume);
  };

  const init = () => {
    tickers.forEach((ticker) => {
      // Muat widget chart (tetap live dari TradingView)
      loadTradingViewWidget(ticker);

      // Muat metrik dari data dummy kita
      const data = dummyData[ticker];
      if (data) {
        updateUIMetrics(ticker, data);
      }
    });
  };

  init();
});
