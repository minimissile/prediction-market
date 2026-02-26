import axios from 'axios';
import type { TimeInterval, MarketTokenInfo } from '@/types';
import { API_CONFIG } from '@/config';

const polymarketApi = axios.create({
  baseURL: API_CONFIG.polymarket.apiUrl,
});

// Polymarket variant 映射
const VARIANT_MAP: Record<string, string> = {
  '5m': 'fiveminute',
  '15m': 'fifteen',
  '1h': 'hourly',
  '4h': 'fourhour',
  '1d': 'daily',
};

// markets API 的分类映射
const CATEGORY_MAP: Record<string, string> = {
  '5m': '5M',
  '15m': '15M',
  '1h': '1H',
  '4h': '4H',
  '1d': 'today',
};

// symbol 到市场标题关键词的映射
const SYMBOL_TITLE_MAP: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  XRP: 'XRP',
};

// 各周期秒数
const INTERVAL_SECONDS: Record<string, number> = {
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};

// 周期标签
const INTERVAL_LABELS: Record<TimeInterval, string> = {
  '1m': '1分钟',
  '3m': '3分钟',
  '5m': '5分钟',
  '15m': '15分钟',
  '30m': '30分钟',
  '1h': '1小时',
  '2h': '2小时',
  '4h': '4小时',
  '6h': '6小时',
  '8h': '8小时',
  '12h': '12小时',
  '1d': '1天',
  '3d': '3天',
  '1w': '1周',
  '1M': '1月',
};

/**
 * 计算当前周期的起止时间（UTC）
 * 注意：4h周期以01:00 UTC为起点（01,05,09,13,17,21）
 *       1d周期以17:00 UTC为起点
 */
function getCurrentPeriod(interval: string): { start: string; end: string; endMs: number } {
  const now = new Date();
  const seconds = INTERVAL_SECONDS[interval] || 3600;
  const ms = seconds * 1000;

  if (interval === '4h') {
    // 4h 周期: 01:00, 05:00, 09:00, 13:00, 17:00, 21:00 UTC
    const hourOfDay = now.getUTCHours();
    const adjusted = ((hourOfDay - 1) + 24) % 24;
    const periodIndex = Math.floor(adjusted / 4);
    const periodStartHour = (periodIndex * 4 + 1) % 24;

    const startDate = new Date(now);
    startDate.setUTCMinutes(0, 0, 0);
    startDate.setUTCHours(periodStartHour);

    // 跨天处理：如 periodStartHour=21 而当前 hour=0，需要退到前一天
    if (periodStartHour > hourOfDay) {
      startDate.setUTCDate(startDate.getUTCDate() - 1);
    }

    const startMs = startDate.getTime();
    const endMs = startMs + ms;

    const start = new Date(startMs).toISOString().replace('.000Z', 'Z');
    const end = new Date(endMs).toISOString().replace('.000Z', 'Z');

    return { start, end, endMs };
  }

  if (interval === '1d') {
    // 1d 周期: 以 17:00 UTC 为起点
    const startDate = new Date(now);
    startDate.setUTCMinutes(0, 0, 0);
    startDate.setUTCHours(17);

    // 如果当前时间还没到今天 17:00 UTC，起点是昨天 17:00
    if (now.getUTCHours() < 17) {
      startDate.setUTCDate(startDate.getUTCDate() - 1);
    }

    const startMs = startDate.getTime();
    const endMs = startMs + ms;

    const start = new Date(startMs).toISOString().replace('.000Z', 'Z');
    const end = new Date(endMs).toISOString().replace('.000Z', 'Z');

    return { start, end, endMs };
  }

  // 其他周期：对齐到标准边界
  const startMs = Math.floor(now.getTime() / ms) * ms;
  const endMs = startMs + ms;

  const start = new Date(startMs).toISOString().replace('.000Z', 'Z');
  const end = new Date(endMs).toISOString().replace('.000Z', 'Z');

  return { start, end, endMs };
}

// crypto-price API 响应类型
interface CryptoPriceResponse {
  openPrice: number;
  closePrice: number | null;
  timestamp: number;
  completed: boolean;
  incomplete: boolean;
}

// past-results API 响应类型
interface PastResultsResponse {
  status: string;
  data: {
    results: {
      startTime: string;
      endTime: string;
      openPrice: number;
      closePrice: number;
      outcome: string;
      percentChange: number;
    }[];
  };
}

// markets API 响应类型
interface MarketsResponse {
  events: {
    title: string;
    markets: {
      question: string;
      outcomes: string[];
      outcomePrices: string[];
      lastTradePrice: number;
      clobTokenIds: string[];
    }[];
  }[];
}

/**
 * 获取某个周期所有币种的预测市场概率
 */
async function getMarketProbabilities(
  interval: string
): Promise<Record<string, number>> {
  const category = CATEGORY_MAP[interval];
  if (!category) return {};

  try {
    const response = await polymarketApi.get<MarketsResponse>('/crypto/markets', {
      params: {
        _c: category,
        _sts: 'active',
        _l: 20,
      },
    });

    const result: Record<string, number> = {};
    for (const event of response.data.events) {
      const market = event.markets[0];
      if (!market) continue;

      // 从标题中匹配币种
      for (const [sym, keyword] of Object.entries(SYMBOL_TITLE_MAP)) {
        if (event.title.includes(keyword)) {
          // 使用 lastTradePrice 作为最新预测概率
          const price = market.lastTradePrice ?? parseFloat(market.outcomePrices[0] || '0.5');
          result[sym] = Math.round(price * 1000) / 10; // 转为百分比，保留1位小数
          break;
        }
      }
    }

    return result;
  } catch (error) {
    console.error(`Failed to fetch market probabilities for ${interval}:`, error);
    return {};
  }
}

/**
 * 获取某个币种某个周期的当前开盘价
 */
export async function getCryptoPrice(
  symbol: string,
  interval: TimeInterval
): Promise<{
  openPrice: number;
  closePrice: number | null;
  completed: boolean;
} | null> {
  const variant = VARIANT_MAP[interval];
  if (!variant) return null;

  const period = getCurrentPeriod(interval);

  try {
    const response = await polymarketApi.get<CryptoPriceResponse>('/crypto/crypto-price', {
      params: {
        symbol,
        variant,
        eventStartTime: period.start,
        endDate: period.end,
      },
    });

    return {
      openPrice: response.data.openPrice,
      closePrice: response.data.closePrice,
      completed: response.data.completed,
    };
  } catch (error) {
    console.error(`Failed to fetch ${symbol} ${interval} price:`, error);
    return null;
  }
}

/**
 * 批量获取多个周期的 Polymarket 开盘价数据 + 真实预测概率
 */
export async function getMultiIntervalOpenPrices(
  symbol: string,
  intervals: TimeInterval[] = ['5m', '15m', '1h', '4h', '1d']
): Promise<
  {
    interval: TimeInterval;
    openPrice: number;
    closePrice: number | null;
    label: string;
    endTime: number;
    probability: number;
  }[]
> {
  // 并行获取: 各周期的开盘价 + 各周期的市场概率
  const [priceResults, ...probabilityResults] = await Promise.all([
    // 获取所有周期的开盘价
    Promise.all(
      intervals.map(async (interval) => {
        const variant = VARIANT_MAP[interval];
        if (!variant) return null;

        const period = getCurrentPeriod(interval);

        try {
          const response = await polymarketApi.get<CryptoPriceResponse>('/crypto/crypto-price', {
            params: {
              symbol,
              variant,
              eventStartTime: period.start,
              endDate: period.end,
            },
          });

          return {
            interval,
            openPrice: response.data.openPrice,
            closePrice: response.data.closePrice,
            endMs: period.endMs,
          };
        } catch (error) {
          console.error(`Failed to fetch ${symbol} ${interval}:`, error);
          return null;
        }
      })
    ),
    // 获取各周期的市场概率
    ...intervals.map((interval) => getMarketProbabilities(interval)),
  ]);

  // 合并概率数据: probabilityResults 是每个 interval 对应的 Record<symbol, probability>
  const probabilityByInterval: Record<string, number> = {};
  intervals.forEach((interval, i) => {
    const probMap = probabilityResults[i] as Record<string, number>;
    if (probMap && probMap[symbol] !== undefined) {
      probabilityByInterval[interval] = probMap[symbol];
    }
  });

  return priceResults
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map((r) => ({
      interval: r.interval,
      openPrice: r.openPrice,
      closePrice: r.closePrice,
      label: INTERVAL_LABELS[r.interval] || r.interval,
      endTime: r.endMs,
      probability: probabilityByInterval[r.interval] ?? 50,
    }));
}

/**
 * 获取某个币种所有周期的最新预测概率（轻量级，仅概率）
 */
export async function getMultiIntervalProbabilities(
  symbol: string,
  intervals: TimeInterval[] = ['5m', '15m', '1h', '4h', '1d']
): Promise<Record<string, number>> {
  const results = await Promise.all(
    intervals.map((interval) => getMarketProbabilities(interval))
  );

  const merged: Record<string, number> = {};
  intervals.forEach((interval, i) => {
    const probMap = results[i];
    if (probMap && probMap[symbol] !== undefined) {
      merged[interval] = probMap[symbol];
    }
  });

  return merged;
}

/**
 * 获取某个币种某个周期的市场 tokenId 信息
 */
export async function getMarketTokenIds(
  symbol: string,
  interval: TimeInterval
): Promise<MarketTokenInfo | null> {
  const category = CATEGORY_MAP[interval];
  if (!category) return null;

  try {
    const response = await polymarketApi.get<MarketsResponse>('/crypto/markets', {
      params: {
        _c: category,
        _sts: 'active',
        _l: 20,
      },
    });

    const keyword = SYMBOL_TITLE_MAP[symbol];
    if (!keyword) return null;

    for (const event of response.data.events) {
      if (!event.title.includes(keyword)) continue;

      const market = event.markets[0];
      if (!market || !market.clobTokenIds || market.clobTokenIds.length < 2) continue;

      const upIndex = market.outcomes.indexOf('Up');
      const downIndex = market.outcomes.indexOf('Down');
      if (upIndex === -1 || downIndex === -1) continue;

      return {
        upTokenId: market.clobTokenIds[upIndex]!,
        downTokenId: market.clobTokenIds[downIndex]!,
        lastTradePrice: market.lastTradePrice,
      };
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch token IDs for ${symbol} ${interval}:`, error);
    return null;
  }
}

/**
 * 获取过去几个周期的历史结果
 */
export async function getPastResults(
  symbol: string,
  interval: TimeInterval,
  count: number = 4
): Promise<
  {
    startTime: string;
    endTime: string;
    openPrice: number;
    closePrice: number;
    outcome: string;
    percentChange: number;
  }[]
> {
  const variant = VARIANT_MAP[interval];
  if (!variant) return [];

  const period = getCurrentPeriod(interval);

  try {
    const response = await polymarketApi.get<PastResultsResponse>('/past-results', {
      params: {
        symbol,
        variant,
        assetType: 'crypto',
        currentEventStartTime: period.start,
        count,
      },
    });

    return response.data?.data?.results || [];
  } catch (error) {
    console.error(`Failed to fetch past results for ${symbol} ${interval}:`, error);
    return [];
  }
}
