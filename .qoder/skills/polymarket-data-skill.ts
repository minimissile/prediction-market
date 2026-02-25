/**
 * Polymarket数据技能
 * 用于获取Polymarket预测市场数据
 */

export const polymarketDataSkill = {
  name: 'polymarket-data-skill',
  description: 'Polymarket预测市场数据获取技能，支持市场信息、价格历史和预测概率',
  version: '1.0.0',

  // API配置
  api: {
    baseUrl: 'https://clob.polymarket.com',
    gammaUrl: 'https://gamma-api.polymarket.com',
  },

  // 支持的操作
  operations: {
    getMarkets: {
      description: '获取市场列表',
      endpoint: '/markets',
      method: 'GET',
      params: {
        next_cursor: { type: 'string', required: false },
        limit: { type: 'number', required: false, default: 100 },
        active: { type: 'boolean', required: false },
      },
      response: {
        type: 'object',
        fields: {
          markets: 'array',
          next_cursor: 'string',
        },
      },
    },

    getMarket: {
      description: '获取单个市场详情',
      endpoint: '/markets/{conditionId}',
      method: 'GET',
      params: {
        conditionId: { type: 'string', required: true },
      },
      response: {
        type: 'object',
        fields: {
          conditionId: 'string',
          question: 'string',
          outcomes: 'array',
          outcomePrices: 'array',
          volume: 'string',
          liquidity: 'string',
          endDate: 'string',
        },
      },
    },

    getPriceHistory: {
      description: '获取价格历史数据',
      endpoint: '/prices-history',
      method: 'GET',
      params: {
        market: { type: 'string', required: true },
        interval: { type: 'string', required: false, default: 'all' },
        fidelity: { type: 'number', required: false },
      },
      response: {
        type: 'object',
        fields: {
          history: {
            type: 'array',
            items: {
              t: 'number (timestamp)',
              p: 'number (price/probability)',
            },
          },
        },
      },
    },

    searchMarkets: {
      description: '搜索市场',
      endpoint: '/search',
      method: 'GET',
      params: {
        q: { type: 'string', required: true, description: '搜索关键词' },
      },
      response: {
        type: 'array',
        description: '匹配的市场列表',
      },
    },
  },

  // 数据映射 - 加密货币相关市场
  cryptoMarkets: {
    bitcoin: {
      description: 'Bitcoin相关预测市场',
      searchTerms: ['bitcoin', 'btc', 'bitcoin price'],
      exampleMarkets: [
        'Will Bitcoin reach $100k by end of 2024?',
        'Bitcoin ETF approval',
      ],
    },
    ethereum: {
      description: 'Ethereum相关预测市场',
      searchTerms: ['ethereum', 'eth', 'ethereum price'],
      exampleMarkets: [
        'Ethereum ETF approval',
        'ETH price prediction',
      ],
    },
    solana: {
      description: 'Solana相关预测市场',
      searchTerms: ['solana', 'sol'],
    },
    xrp: {
      description: 'XRP相关预测市场',
      searchTerms: ['xrp', 'ripple'],
    },
  },

  // 数据转换
  transforms: {
    probabilityToPrice: `
      将概率数据叠加到K线图：
      - 概率范围: 0-1 (0%-100%)
      - 显示在右侧独立Y轴
      - 使用不同颜色区分
    `,
    
    alignTimestamps: `
      对齐Polymarket数据和K线数据的时间戳：
      - Polymarket使用秒级时间戳
      - 需要与K线数据的时间粒度匹配
    `,
  },

  // 注意事项
  notes: [
    'Polymarket API可能需要特定的认证',
    '部分API端点可能有访问限制',
    '某些加密货币可能没有对应的预测市场',
    '数据更新频率可能与K线不同，需要适当处理',
  ],

  // 使用示例
  examples: [
    {
      description: '搜索Bitcoin相关预测市场',
      code: `
        const markets = await searchMarkets('bitcoin price');
        return markets.filter(m => m.active);
      `,
    },
    {
      description: '获取市场价格历史',
      code: `
        const history = await getPriceHistory(conditionId);
        return history.map(h => ({
          time: h.t,
          probability: h.p
        }));
      `,
    },
    {
      description: '叠加显示预测数据',
      code: `
        // 模拟数据用于演示
        const mockData = getMockPredictionData(symbol, targetPrice);
        chart.addPolymarketOverlay(mockData);
      `,
    },
  ],

  // 模拟数据生成（用于演示）
  mockDataGenerator: {
    description: '生成模拟的预测市场数据，用于演示和测试',
    params: {
      symbol: 'string',
      dataPoints: 'number (default: 100)',
    },
    output: 'PolymarketData[]',
  },
};

export default polymarketDataSkill;
