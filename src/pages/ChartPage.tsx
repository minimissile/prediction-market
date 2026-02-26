import React, { useState, useEffect, useRef } from 'react';
import { Spin, Alert, Collapse, Tag, Switch, Space, Drawer, FloatButton } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { KlineChart, RayLineConfig, ChartControls } from '@/components';
import { useKlineData } from '@/hooks/useKlineData';
import { get24hrTicker } from '@/services/binanceService';
import {
  getMockPredictionData,
  getMultiIntervalPredictionData,
} from '@/services/polymarketService';
import { DEFAULT_SYMBOL, DEFAULT_INTERVAL, DEFAULT_POLYMARKET_INTERVAL } from '@/config';
import type { SymbolConfig, TimeInterval, RayLine, PolymarketData } from '@/types';

// Polymarket射线ID前缀
const POLYMARKET_RAY_PREFIX = 'polymarket-';

// 各时间周期射线的颜色配置
const INTERVAL_COLORS: Record<string, string> = {
  '5m': '#52c41a', // 绿色
  '15m': '#1890ff', // 蓝色
  '1h': '#fa8c16', // 橙色
  '4h': '#eb2f96', // 粉色
  '1d': '#722ed1', // 紫色
};

// Polymarket默认获取的时间周期
const POLYMARKET_DEFAULT_INTERVALS: TimeInterval[] = ['5m', '15m', '1h', '4h', '1d'];

const ChartPage: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolConfig>(DEFAULT_SYMBOL);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(DEFAULT_INTERVAL);
  const [polymarketInterval, setPolymarketInterval] = useState<TimeInterval>(
    DEFAULT_POLYMARKET_INTERVAL
  );
  const [rayLines, setRayLines] = useState<RayLine[]>([]);
  const [showPolymarket, setShowPolymarket] = useState(false);
  const [showOpenPriceRays, setShowOpenPriceRays] = useState(true);
  const [polymarketData, setPolymarketData] = useState<PolymarketData[]>([]);
  const [polymarketOpenPrices, setPolymarketOpenPrices] = useState<
    { interval: TimeInterval; openPrice: number; label: string }[]
  >([]);
  const [priceInfo, setPriceInfo] = useState<{
    lastPrice: number;
    priceChange: number;
    priceChangePercent: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const prevShowPolymarket = useRef(showPolymarket);
  const prevShowOpenPriceRays = useRef(showOpenPriceRays);

  const {
    data: klineData,
    loading,
    error,
  } = useKlineData({
    symbol: selectedSymbol.symbol,
    interval: selectedInterval,
  });

  // 获取24小时行情数据
  useEffect(() => {
    const fetchPriceInfo = async () => {
      try {
        const info = await get24hrTicker(selectedSymbol.symbol);
        setPriceInfo(info);
      } catch (err) {
        console.error('Failed to fetch price info:', err);
      }
    };

    fetchPriceInfo();
    const interval = setInterval(fetchPriceInfo, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol.symbol]);

  // 获取Polymarket数据（当前选中周期的图表数据）
  useEffect(() => {
    if (showPolymarket && selectedSymbol.polymarketSlug) {
      const dataPointsMap: Record<TimeInterval, number> = {
        '1m': 60,
        '3m': 60,
        '5m': 120,
        '15m': 96,
        '30m': 48,
        '1h': 72,
        '2h': 48,
        '4h': 42,
        '6h': 28,
        '8h': 21,
        '12h': 14,
        '1d': 30,
        '3d': 30,
        '1w': 12,
        '1M': 12,
      };

      const dataPoints = dataPointsMap[polymarketInterval] || 100;

      const { data } = getMockPredictionData(
        selectedSymbol.symbol,
        priceInfo?.lastPrice || 0,
        dataPoints,
        polymarketInterval
      );
      setPolymarketData(data);
    } else {
      setPolymarketData([]);
    }
  }, [showPolymarket, selectedSymbol, priceInfo?.lastPrice, polymarketInterval]);

  // 获取所有时间周期的开盘价
  useEffect(() => {
    if (showPolymarket && selectedSymbol.polymarketSlug && priceInfo?.lastPrice) {
      const openPrices = getMultiIntervalPredictionData(
        selectedSymbol.symbol,
        priceInfo.lastPrice,
        POLYMARKET_DEFAULT_INTERVALS
      );
      setPolymarketOpenPrices(openPrices);
    } else {
      setPolymarketOpenPrices([]);
    }
  }, [showPolymarket, selectedSymbol, priceInfo?.lastPrice]);

  // 处理Polymarket多周期开盘价射线
  useEffect(() => {
    if (showPolymarket && showOpenPriceRays && polymarketOpenPrices.length > 0) {
      setRayLines((prev) => {
        const filtered = prev.filter((ray) => !ray.id.startsWith(POLYMARKET_RAY_PREFIX));
        const polymarketRays: RayLine[] = polymarketOpenPrices.map((item) => ({
          id: `${POLYMARKET_RAY_PREFIX}${item.interval}`,
          price: item.openPrice,
          color: INTERVAL_COLORS[item.interval] || '#fa8c16',
          label: `${item.label}: $${item.openPrice.toLocaleString()}`,
          lineStyle: 'dashed',
          lineWidth: 1,
        }));
        return [...filtered, ...polymarketRays];
      });
    }

    if (
      (!showPolymarket && prevShowPolymarket.current) ||
      (!showOpenPriceRays && prevShowOpenPriceRays.current)
    ) {
      setRayLines((prev) => prev.filter((ray) => !ray.id.startsWith(POLYMARKET_RAY_PREFIX)));
    }

    prevShowPolymarket.current = showPolymarket;
    prevShowOpenPriceRays.current = showOpenPriceRays;
  }, [showPolymarket, showOpenPriceRays, polymarketOpenPrices]);

  const handleSymbolChange = (symbol: SymbolConfig) => {
    setSelectedSymbol(symbol);
    setRayLines((prev) => prev.filter((ray) => ray.id.startsWith(POLYMARKET_RAY_PREFIX)));
  };

  const handleRayLinesChange = (newRayLines: RayLine[]) => {
    const polymarketRays = rayLines.filter((ray) => ray.id.startsWith(POLYMARKET_RAY_PREFIX));
    if (showPolymarket && showOpenPriceRays && polymarketRays.length > 0) {
      const userRays = newRayLines.filter((ray) => !ray.id.startsWith(POLYMARKET_RAY_PREFIX));
      setRayLines([...userRays, ...polymarketRays]);
      return;
    }
    setRayLines(newRayLines);
  };

  if (error) {
    return <Alert message="数据加载失败" description={error.message} type="error" showIcon />;
  }

  const userRayLines = rayLines.filter((ray) => !ray.id.startsWith(POLYMARKET_RAY_PREFIX));

  return (
    <div
      style={{
        padding: '8px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <ChartControls
          selectedSymbol={selectedSymbol}
          selectedInterval={selectedInterval}
          polymarketInterval={polymarketInterval}
          showPolymarket={showPolymarket}
          onSymbolChange={handleSymbolChange}
          onIntervalChange={setSelectedInterval}
          onPolymarketIntervalChange={setPolymarketInterval}
          onPolymarketToggle={setShowPolymarket}
          priceInfo={priceInfo}
        />
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <Spin spinning={loading} style={{ height: '100%' }}>
          <KlineChart
            data={klineData}
            rayLines={rayLines}
            polymarketData={polymarketData}
            height={window.innerHeight - 120}
          />
        </Spin>
      </div>

      {/* 设置按钮 */}
      <FloatButton
        icon={<SettingOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={() => setDrawerOpen(true)}
      />

      {/* 侧边栏 */}
      <Drawer
        title="设置"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={320}
        styles={{
          header: { background: '#1a1a2e', borderBottom: '1px solid #2a2a3e' },
          body: { background: '#1a1a2e', padding: 0 },
        }}
      >
        <Collapse
          defaultActiveKey={['rayline', 'polymarket']}
          size="small"
          bordered={false}
          style={{ background: 'transparent' }}
          items={[
            {
              key: 'rayline',
              label: (
                <span style={{ color: '#fff' }}>
                  <SettingOutlined style={{ marginRight: 8 }} />
                  自定义射线
                </span>
              ),
              children: (
                <RayLineConfig
                  rayLines={userRayLines}
                  onChange={handleRayLinesChange}
                  currentPrice={priceInfo?.lastPrice}
                />
              ),
              style: { borderBottom: '1px solid #2a2a3e' },
            },
            ...(showPolymarket && polymarketOpenPrices.length > 0
              ? [
                  {
                    key: 'polymarket',
                    label: (
                      <Space
                        style={{ width: '100%', justifyContent: 'space-between' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span style={{ color: '#fa8c16' }}>Polymarket 开盘价</span>
                        <Switch
                          size="small"
                          checked={showOpenPriceRays}
                          onChange={setShowOpenPriceRays}
                        />
                      </Space>
                    ),
                    children: (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {polymarketOpenPrices.map((item) => (
                          <div
                            key={item.interval}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              opacity: showOpenPriceRays ? 1 : 0.5,
                            }}
                          >
                            <Tag color={INTERVAL_COLORS[item.interval]} style={{ margin: 0 }}>
                              {item.label}
                            </Tag>
                            <span style={{ color: '#fff', fontWeight: 500 }}>
                              ${item.openPrice.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ),
                    style: { borderBottom: '1px solid #2a2a3e' },
                  },
                ]
              : []),
          ]}
        />
      </Drawer>
    </div>
  );
};

export default ChartPage;
