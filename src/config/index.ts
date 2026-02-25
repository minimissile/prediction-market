import type { SymbolConfig, TimeInterval } from '@/types';

// 支持的币种配置
export const SYMBOLS: SymbolConfig[] = [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    displayName: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    pricePrecision: 2,
    polymarketSlug: 'bitcoin',
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    displayName: 'ETH/USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    pricePrecision: 2,
    polymarketSlug: 'ethereum',
  },
  {
    symbol: 'SOLUSDT',
    name: 'Solana',
    displayName: 'SOL/USDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    pricePrecision: 2,
    polymarketSlug: 'solana',
  },
  {
    symbol: 'XRPUSDT',
    name: 'XRP',
    displayName: 'XRP/USDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    pricePrecision: 4,
    polymarketSlug: 'xrp',
  },
  {
    symbol: 'BNBUSDT',
    name: 'BNB',
    displayName: 'BNB/USDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    pricePrecision: 2,
  },
  {
    symbol: 'ADAUSDT',
    name: 'Cardano',
    displayName: 'ADA/USDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    pricePrecision: 4,
  },
  {
    symbol: 'DOGEUSDT',
    name: 'Dogecoin',
    displayName: 'DOGE/USDT',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    pricePrecision: 5,
  },
];

// K线时间周期配置
export const TIME_INTERVALS: { value: TimeInterval; label: string }[] = [
  { value: '1m', label: '1分钟' },
  { value: '5m', label: '5分钟' },
  { value: '15m', label: '15分钟' },
  { value: '30m', label: '30分钟' },
  { value: '1h', label: '1小时' },
  { value: '4h', label: '4小时' },
  { value: '1d', label: '1天' },
  { value: '1w', label: '1周' },
];

// Polymarket预测市场时间周期配置
export const POLYMARKET_INTERVALS: { value: TimeInterval; label: string }[] = [
  { value: '5m', label: '5分钟' },
  { value: '15m', label: '15分钟' },
  { value: '1h', label: '1小时' },
  { value: '4h', label: '4小时' },
  { value: '1d', label: '1天' },
];

// 默认配置
export const DEFAULT_SYMBOL = SYMBOLS[0]!;
export const DEFAULT_INTERVAL: TimeInterval = '1h';
export const DEFAULT_POLYMARKET_INTERVAL: TimeInterval = '1h';

// API配置
export const API_CONFIG = {
  binance: {
    baseUrl: '/api/binance',
    wsUrl: 'wss://stream.binance.com:9443/ws',
  },
  polymarket: {
    baseUrl: 'https://clob.polymarket.com',
  },
};

// 图表颜色配置
export const CHART_COLORS = {
  background: '#1a1a2e',
  text: '#d1d4dc',
  grid: '#2a2a3e',
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
};
