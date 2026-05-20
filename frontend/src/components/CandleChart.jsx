import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import chartService from '../services/chartService';

const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT'];
const intervals = [
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
];

const CandleChart = ({ symbol: externalSymbol, interval: externalInterval } = {}) => {
  const [symbol, setSymbol] = useState(externalSymbol || 'BTCUSDT');
  const [interval, setChartInterval] = useState(externalInterval || '5m');
  const [series, setSeries] = useState([{
    name: `${externalSymbol || 'BTCUSDT'} ${externalInterval || '5m'}`,
    data: []
  }]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => {
    if (externalSymbol && externalSymbol !== symbol) {
      setSymbol(externalSymbol);
    }
  }, [externalSymbol, symbol]);

  useEffect(() => {
    if (externalInterval && externalInterval !== interval) {
      setChartInterval(externalInterval);
    }
  }, [externalInterval, interval]);

  const fetchCandles = async (autoRefresh = false) => {
    console.log('Fetching candles for', symbol, interval);
    setError('');
    setStatus(`Requesting ${symbol} ${interval} candles...`);
    if (autoRefresh && series[0]?.data?.length > 0) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const { candles } = await chartService.getCandles({ symbol, interval, limit: 50 });
      console.log('Fetched candles:', candles);
      const chartData = candles.map((candle) => ({
        x: new Date(candle.time),
        y: [parseFloat(candle.open), parseFloat(candle.high), parseFloat(candle.low), parseFloat(candle.close)],
      })).sort((a, b) => a.x - b.x);
      console.log('Chart data:', chartData);
      setSeries([
        {
          name: `${symbol} ${interval}`,
          data: chartData,
        },
      ]);
      setStatus(`Loaded ${chartData.length} candles for ${symbol} ${interval}`);
    } catch (error2) {
      console.error('Error fetching candles:', error2);
      setError(error2?.response?.data?.message || error2.message || 'Unable to load candle data');
      setStatus('Failed to load chart');
    } finally {
      if (autoRefresh && series[0]?.data?.length > 0) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCandles();
    const intervalId = setInterval(() => fetchCandles(true), 10000);
    return () => clearInterval(intervalId);
  }, [symbol, interval]);

  const options = {
    chart: {
      type: 'candlestick',
      height: 420,
      toolbar: { show: true },
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 450,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 300 },
      },
    },
    title: {
      text: `${symbol} ${interval} Candles`,
      align: 'left',
      style: { color: '#e2e8f0' },
    },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#94a3b8' } },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: { style: { colors: '#94a3b8' } },
    },
    theme: { mode: 'dark' },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#34d399',
          downward: '#f87171',
        },
      },
    },
  };

  return (
    <div className="rounded-3xl bg-slate-900/80 p-8 shadow-lg shadow-slate-950/20">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Candlestick chart</h2>
          <p className="mt-1 text-sm text-slate-400">Real-time Binance market candles for the selected pair.</p>
          <p className="mt-1 text-sm text-slate-400">{status}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
          >
            {symbols.map((item) => (
              <option key={item} value={item} className="bg-slate-950 text-slate-100">
                {item}
              </option>
            ))}
          </select>
          <select
            value={interval}
            onChange={(event) => setChartInterval(event.target.value)}
            className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
          >
            {intervals.map((item) => (
              <option key={item.value} value={item.value} className="bg-slate-950 text-slate-100">
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-center text-rose-300">
          {error}
        </div>
      )}
      {(loading && series[0]?.data?.length === 0) ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-center text-slate-400">
          Loading candle data...
        </div>
      ) : series[0]?.data?.length > 0 ? (
        <div className="relative">
          <Chart options={options} series={series} type="candlestick" height={420} />
          {isRefreshing && (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-slate-950/90 px-4 py-2 text-xs text-slate-200 shadow-lg shadow-slate-950/40">
              Updating chart...
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-center text-slate-400">
          No data available
        </div>
      )}
    </div>
  );
};

export default CandleChart;
