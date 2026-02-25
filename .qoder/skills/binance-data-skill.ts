/**
 * 币安数据技能
 * 用于获取币安交易所的K线和行情数据
 */

export const binanceDataSkill = {
  name: 'binance-data-skill',
  description: '币安数据获取技能，支持K线数据、实时行情和WebSocket推送',
  version: '1.0.0',

  // API配置
  api: {
    baseUrl: 'https://api.binance.com',
    wsUrl: 'wss://stream.binance.com:9443/ws',
  },

  // 支持的操作
  operations: {
    getKlines: {
      description: '获取K线数据',
      endpoint: '/api/v3/klines',
      method: 'GET',
      params: {
        symbol: { type: 'string', required: true, example: 'BTCUSDT' },
        interval: { type: 'string', required: true, example: '1h' },
        limit: { type: 'number', required: false, default: 500, max: 1000 },
        startTime: { type: 'number', required: false },
        endTime: { type: 'number', required: false },
      },
      response: {
        type: 'array',
        description: 'K线数据数组，每个元素包含：开盘时间、开盘价、最高价、最低价、收盘价、成交量等',
      },
    },

    getTickerPrice: {
      description: '获取最新价格',
      endpoint: '/api/v3/ticker/price',
      method: 'GET',
      params: {
        symbol: { type: 'string', required: true, example: 'BTCUSDT' },
      },
      response: {
        type: 'object',
        fields: {
          symbol: 'string',
          price: 'string',
        },
      },
    },

    get24hrTicker: {
      description: '获取24小时行情统计',
      endpoint: '/api/v3/ticker/24hr',
      method: 'GET',
      params: {
        symbol: { type: 'string', required: true, example: 'BTCUSDT' },
      },
      response: {
        type: 'object',
        fields: {
          priceChange: 'string',
          priceChangePercent: 'string',
          lastPrice: 'string',
          highPrice: 'string',
          lowPrice: 'string',
          volume: 'string',
          quoteVolume: 'string',
        },
      },
    },

    subscribeKline: {
      description: '订阅实时K线WebSocket',
      wsStream: '<symbol>@kline_<interval>',
      example: 'btcusdt@kline_1h',
      message: {
        type: 'object',
        fields: {
          e: 'kline (事件类型)',
          E: 'number (事件时间)',
          s: 'string (交易对)',
          k: {
            t: 'number (K线开盘时间)',
            T: 'number (K线收盘时间)',
            o: 'string (开盘价)',
            h: 'string (最高价)',
            l: 'string (最低价)',
            c: 'string (收盘价)',
            v: 'string (成交量)',
            x: 'boolean (K线是否完结)',
          },
        },
      },
    },
  },

  // 数据转换函数
  transforms: {
    parseKline: `
      将币安原始K线数据转换为标准格式：
      输入: [timestamp, open, high, low, close, volume, ...]
      输出: { time, open, high, low, close, volume }
    `,
  },

  // 错误处理
  errorCodes: {
    '-1121': '无效的交易对',
    '-1100': '非法字符',
    '-1000': '未知错误',
  },

  // 使用示例
  examples: [
    {
      description: '获取BTC/USDT的1小时K线数据',
      code: `
        const klines = await getKlines('BTCUSDT', '1h', 500);
        return klines.map(parseKline);
      `,
    },
    {
      description: '订阅实时K线更新',
      code: `
        const ws = createKlineWebSocket('BTCUSDT', '1h', (data) => {
          console.log('New kline:', data);
        });
      `,
    },
  ],
};

export default binanceDataSkill;
