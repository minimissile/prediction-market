import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Alert, Collapse } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { KlineChart, RayLineConfig, ChartControls } from '@/components';
import { useKlineData } from '@/hooks/useKlineData';
import { get24hrTicker } from '@/services/binanceService';
import { getMockPredictionData } from '@/services/polymarketService';
import { DEFAULT_SYMBOL, DEFAULT_INTERVAL, DEFAULT_POLYMARKET_INTERVAL } from '@/config';
import type { SymbolConfig, TimeInterval, RayLine, PolymarketData } from '@/types';

const ChartPage: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolConfig>(DEFAULT_SYMBOL);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(DEFAULT_INTERVAL);
  const [polymarketInterval, setPolymarketInterval] = useState<TimeInterval>(DEFAULT_POLYMARKET_INTERVAL);
  const [rayLines, setRayLines] = useState<RayLine[]>([]);
  const [showPolymarket, setShowPolymarket] = useState(false);
  const [polymarketData, setPolymarketData] = useState<PolymarketData[]>([]);
  const [priceInfo, setPriceInfo] = useState<{
    lastPrice: number;
    priceChange: number;
    priceChangePercent: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
  } | null>(null);

  const { data: klineData, loading, error } = useKlineData({
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

  // 获取Polymarket数据
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
      
      const mockData = getMockPredictionData(
        selectedSymbol.symbol,
        priceInfo?.lastPrice || 0,
        dataPoints,
        polymarketInterval
      );
      setPolymarketData(mockData);
    } else {
      setPolymarketData([]);
    }
  }, [showPolymarket, selectedSymbol, priceInfo?.lastPrice, polymarketInterval]);

  const handleSymbolChange = (symbol: SymbolConfig) => {
    setSelectedSymbol(symbol);
    setRayLines([]);
  };

  if (error) {
    return (
      <Alert
        message="数据加载失败"
        description={error.message}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div style={{ padding: '8px 12px', height: 'calc(100vh - 64px - 69px)', display: 'flex', flexDirection: 'column' }}>
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
            defaultActiveKey={['rayline']}
            size="small"
            items={[
              {
                key: 'rayline',
                label: (
                  <span>
                    <SettingOutlined style={{ marginRight: 8 }} />
                    射线配置
                  </span>
                ),
                children: (
                  <RayLineConfig
                    rayLines={rayLines}
                    onChange={setRayLines}
                    currentPrice={priceInfo?.lastPrice}
                  />
                ),
              },
            ]}
            style={{ background: '#1a1a2e' }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ChartPage;
