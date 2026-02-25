/**
 * K线图表代理配置
 * 专门用于处理K线图表相关任务的AI代理
 */

export const klineChartAgent = {
  name: 'kline-chart-agent',
  description: 'K线图表专用代理，处理图表配置、数据分析和技术指标相关任务',
  
  capabilities: [
    '创建和配置K线图表',
    '添加和管理射线(价格参考线)',
    '切换币种和时间周期',
    '分析K线形态和趋势',
    '集成多数据源(币安、Polymarket)',
  ],

  // 代理可以访问的工具
  tools: [
    'binance-data-skill',
    'polymarket-data-skill',
    'chart-config',
  ],

  // 代理配置
  config: {
    // 默认币种
    defaultSymbol: 'BTCUSDT',
    // 默认时间周期
    defaultInterval: '1h',
    // 支持的币种列表
    supportedSymbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT'],
    // 支持的时间周期
    supportedIntervals: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'],
  },

  // 代理指令模板
  prompts: {
    chartSetup: `
      帮助用户设置K线图表：
      1. 确认用户想要查看的币种
      2. 确认时间周期
      3. 询问是否需要添加射线
      4. 询问是否需要叠加Polymarket数据
    `,
    
    rayLineSetup: `
      帮助用户设置射线：
      1. 获取用户想要标注的价格
      2. 确认射线颜色和样式
      3. 添加可选的标签
    `,
    
    dataAnalysis: `
      分析K线数据：
      1. 识别当前趋势
      2. 找出关键支撑和阻力位
      3. 计算常用技术指标
    `,
  },

  // 示例用法
  examples: [
    {
      userInput: '显示BTC的1小时K线',
      agentAction: '调用binance-data-skill获取BTCUSDT 1h数据，渲染K线图',
    },
    {
      userInput: '在100000美元位置添加一条红色射线',
      agentAction: '创建射线配置 { price: 100000, color: "#ef5350" }，更新图表',
    },
    {
      userInput: '叠加显示Polymarket预测数据',
      agentAction: '调用polymarket-data-skill获取相关预测数据，在图表上叠加显示',
    },
  ],
};

export default klineChartAgent;
