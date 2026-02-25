// K线数据类型
export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 图表K线数据格式 (lightweight-charts)
export interface ChartKlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// 币安API原始K线数据
export type BinanceKlineRaw = [
  number,   // 0: 开盘时间
  string,   // 1: 开盘价
  string,   // 2: 最高价
  string,   // 3: 最低价
  string,   // 4: 收盘价
  string,   // 5: 成交量
  number,   // 6: 收盘时间
  string,   // 7: 成交额
  number,   // 8: 成交笔数
  string,   // 9: 主动买入成交量
  string,   // 10: 主动买入成交额
  string    // 11: 忽略
];

// 射线配置
export interface RayLine {
  id: string;
  price: number;
  color: string;
  label?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

// 币种配置
export interface SymbolConfig {
  symbol: string;
  name: string;
  displayName: string;
  baseAsset: string;
  quoteAsset: string;
  pricePrecision: number;
  polymarketSlug?: string;
}

// 时间周期
export type TimeInterval = 
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '6h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M';

// Polymarket预测数据
export interface PolymarketData {
  time: number;
  probability: number;
  volume?: number;
}

// Polymarket市场信息
export interface PolymarketMarketInfo {
  openPrice: number;
  question?: string;
  outcomes?: string[];
}

// 图表配置
export interface ChartConfig {
  symbol: SymbolConfig;
  interval: TimeInterval;
  rayLines: RayLine[];
  showPolymarket: boolean;
}
