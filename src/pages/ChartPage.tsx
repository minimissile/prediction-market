import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Spin, Alert, Collapse, Tag } from 'antd';
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

  const prevShowPolymarket = useRef(showPolymarket);

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
    if (showPolymarket && polymarketOpenPrices.length > 0) {
      setRayLines((prev) => {
        // 移除所有旧的Polymarket射线
        const filtered = prev.filter((ray) => !ray.id.startsWith(POLYMARKET_RAY_PREFIX));

        // 添加所有时间周期的开盘价射线
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

    // 当关闭Polymarket时，移除所有Polymarket射线
    if (!showPolymarket && prevShowPolymarket.current) {
      setRayLines((prev) => prev.filter((ray) => !ray.id.startsWith(POLYMARKET_RAY_PREFIX)));
    }

    prevShowPolymarket.current = showPolymarket;
  }, [showPolymarket, polymarketOpenPrices]);

  const handleSymbolChange = (symbol: SymbolConfig) => {
    setSelectedSymbol(symbol);
    // 切换币种时清空用户添加的射线，保留Polymarket射线会在下次effect中更新
    setRayLines((prev) => prev.filter((ray) => ray.id.startsWith(POLYMARKET_RAY_PREFIX)));
  };

  // 处理用户手动修改射线
  const handleRayLinesChange = (newRayLines: RayLine[]) => {
    // 保留Polymarket射线
    const polymarketRays = rayLines.filter((ray) => ray.id.startsWith(POLYMARKET_RAY_PREFIX));
    if (showPolymarket && polymarketRays.length > 0) {
      // 合并用户射线和Polymarket射线
      const userRays = newRayLines.filter((ray) => !ray.id.startsWith(POLYMARKET_RAY_PREFIX));
      setRayLines([...userRays, ...polymarketRays]);
      return;
    }
    setRayLines(newRayLines);
  };

  if (error) {
    return <Alert message="数据加载失败" description={error.message} type="error" showIcon />;
  }

  // 过滤掉Polymarket射线，只显示用户添加的射线供编辑
  const userRayLines = rayLines.filter((ray) => !ray.id.startsWith(POLYMARKET_RAY_PREFIX));

  return (
    <div
      style={{
        padding: '8px 12px',
        height: 'calc(100vh - 64px - 69px)',
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

      <Row gutter={[8, 8]} style={{ flex: 1, minHeight: 0 }}>
        <Col xs={24} xl={20} style={{ height: '100%' }}>
          <Spin spinning={loading} style={{ height: '100%' }}>
            <KlineChart
              data={klineData}
              rayLines={rayLines}
              polymarketData={polymarketData}
              height={Math.max(500, window.innerHeight - 250)}
            />
          </Spin>
        </Col>

        <Col xs={24} xl={4}>
          <Collapse
            defaultActiveKey={['rayline', 'polymarket']}
            size="small"
            items={[
              {
                key: 'rayline',
                label: (
                  <span>
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
              },
              ...(showPolymarket && polymarketOpenPrices.length > 0
                ? [
                    {
                      key: 'polymarket',
                      label: <span style={{ color: '#fa8c16' }}>Polymarket 开盘价</span>,
                      children: (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {polymarketOpenPrices.map((item) => (
                            <div
                              key={item.interval}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
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
                    },
                  ]
                : []),
            ]}
            style={{ background: '#1a1a2e' }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ChartPage;
