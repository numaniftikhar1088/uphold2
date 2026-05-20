import { useEffect, useRef } from 'react';

const TradingViewChart = ({ symbol = 'BTCUSDT', interval = '60', height = 500 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Debounce: wait 400ms before rebuilding the widget so rapid symbol
    // switching doesn't fire a reload on every click.
    const timer = setTimeout(() => {
      container.innerHTML = '';

      const widgetDiv = document.createElement('div');
      widgetDiv.className = 'tradingview-widget-container__widget';
      container.appendChild(widgetDiv);

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: false,
        width: '100%',
        height: height,
        symbol: `BINANCE:${symbol}`,
        interval,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        allow_symbol_change: false,
        calendar: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        backgroundColor: 'rgba(2, 6, 23, 0)',
        gridColor: 'rgba(100, 116, 139, 0.1)',
      });
      container.appendChild(script);
    }, 400);

    return () => {
      clearTimeout(timer);
      container.innerHTML = '';
    };
  }, [symbol, interval]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ width: '100%', minHeight: `${height}px` }}
    />
  );
};

export default TradingViewChart;
