# Prediction Market - K线图表展示工具

一个专业的加密货币K线图表分析工具，集成币安实时数据和Polymarket预测市场数据。

## 功能特性

- **K线图表显示** - 使用 lightweight-charts 绘制专业级K线图
- **自定义射线** - 支持添加多条价格参考线，自定义颜色、样式和标签
- **实时数据** - 接入币安 WebSocket，实时推送K线更新
- **多币种支持** - BTC、ETH、SOL、XRP、BNB、ADA、DOGE
- **多时间周期** - 1分钟、5分钟、15分钟、30分钟、1小时、4小时、1天、1周
- **Polymarket叠加** - 预测市场概率数据可视化叠加显示
- **深色主题** - 专业交易界面风格

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **UI组件库**: Ant Design 5 (暗色主题)
- **图表库**: lightweight-charts 4
- **路由管理**: React Router 7
- **HTTP客户端**: Axios
- **数据源**: Binance API、Polymarket API

## 项目结构

```
src/
├── components/           # UI组件
│   ├── KlineChart.tsx    # K线图表组件
│   ├── RayLineConfig.tsx # 射线配置面板
│   └── ChartControls.tsx # 控制栏组件
├── pages/                # 页面
│   ├── HomePage.tsx      # 首页
│   └── ChartPage.tsx     # 图表页
├── services/             # 数据服务
│   ├── binanceService.ts # 币安API服务
│   └── polymarketService.ts # Polymarket服务
├── hooks/                # 自定义Hooks
│   └── useKlineData.ts   # K线数据Hook
├── config/               # 配置文件
│   └── index.ts          # 币种/周期/颜色配置
├── types/                # TypeScript类型定义
├── layouts/              # 布局组件
└── router/               # 路由配置
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 使用说明

### 查看K线图表

1. 访问首页，点击"开始使用"进入图表页面
2. 使用顶部控制栏选择币种和时间周期
3. 图表会自动加载历史数据并通过WebSocket实时更新

### 添加射线

1. 在右侧"射线配置"面板中输入目标价格
2. 选择射线颜色和线条样式（实线/虚线/点线）
3. 点击"添加"按钮，射线将显示在图表上
4. 可点击"使用当前价格"快速填入最新价格

### 叠加Polymarket数据

1. 选择支持Polymarket的币种（BTC、ETH、SOL、XRP）
2. 开启"Polymarket叠加"开关
3. 预测概率数据将以橙色曲线显示在图表上

## API说明

### 币安API

- REST API: `https://api.binance.com`
- WebSocket: `wss://stream.binance.com:9443/ws`
- 通过Vite代理解决跨域问题

### Polymarket API

- CLOB API: `https://clob.polymarket.com`
- 当前使用模拟数据演示，可对接真实API

## 配置说明

### 添加新币种

编辑 `src/config/index.ts`：

```typescript
export const SYMBOLS: SymbolConfig[] = [
  {
    symbol: 'NEWUSDT',
    name: 'NewCoin',
    displayName: 'NEW/USDT',
    baseAsset: 'NEW',
    quoteAsset: 'USDT',
    pricePrecision: 4,
    polymarketSlug: 'newcoin', // 可选
  },
  // ...
];
```

### 修改图表颜色

编辑 `src/config/index.ts` 中的 `CHART_COLORS`：

```typescript
export const CHART_COLORS = {
  background: '#1a1a2e',
  upColor: '#26a69a',
  downColor: '#ef5350',
  // ...
};
```

## License

MIT
