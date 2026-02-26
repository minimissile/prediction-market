import axios from 'axios';
import type { KlineData, BinanceKlineRaw, TimeInterval } from '@/types';
import { API_CONFIG } from '@/config';

const binanceApi = axios.create({
  baseURL: API_CONFIG.binance.baseUrl,
});

/**
 * 获取K线数据
 */
export async function getKlines(
  symbol: string,
  interval: TimeInterval,
  limit: number = 500
): Promise<KlineData[]> {
  const response = await binanceApi.get<BinanceKlineRaw[]>('/api/v3/klines', {
    params: {
      symbol,
      interval,
      limit,
    },
  });

  return response.data.map(parseKlineData);
}

/**
 * 获取最新价格
 */
export async function getTickerPrice(symbol: string): Promise<number> {
  const response = await binanceApi.get<{ symbol: string; price: string }>('/api/v3/ticker/price', {
    params: { symbol },
  });
  return parseFloat(response.data.price);
}

/**
 * 获取24小时行情
 */
export async function get24hrTicker(symbol: string): Promise<{
  priceChange: number;
  priceChangePercent: number;
  lastPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
}> {
  const response = await binanceApi.get('/api/v3/ticker/24hr', {
    params: { symbol },
  });

  const data = response.data;
  return {
    priceChange: parseFloat(data.priceChange),
    priceChangePercent: parseFloat(data.priceChangePercent),
    lastPrice: parseFloat(data.lastPrice),
    highPrice: parseFloat(data.highPrice),
    lowPrice: parseFloat(data.lowPrice),
    volume: parseFloat(data.volume),
  };
}

/**
 * 解析K线数据
 */
function parseKlineData(raw: BinanceKlineRaw): KlineData {
  return {
    time: raw[0] / 1000, // 转换为秒
    open: parseFloat(raw[1]),
    high: parseFloat(raw[2]),
    low: parseFloat(raw[3]),
    close: parseFloat(raw[4]),
    volume: parseFloat(raw[5]),
  };
}

/**
 * 创建WebSocket连接获取实时K线
 */
export function createKlineWebSocket(
  symbol: string,
  interval: TimeInterval,
  onMessage: (data: KlineData) => void
): WebSocket {
  const wsSymbol = symbol.toLowerCase();
  const ws = new WebSocket(`${API_CONFIG.binance.wsUrl}/${wsSymbol}@kline_${interval}`);

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const kline = message.k;

    if (kline) {
      onMessage({
        time: kline.t / 1000,
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c),
        volume: parseFloat(kline.v),
      });
    }
  };

  return ws;
}
