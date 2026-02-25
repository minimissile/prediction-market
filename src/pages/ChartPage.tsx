import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Alert } from 'antd';
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
      // 根据polymarketInterval计算数据点数量
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
      
      // 使用模拟数据演示，传入时间周期
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
    setRayLines([]); // 切换币种时清空射线
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
    <div style={{ padding: '16px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
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
        </Col>

        <Col xs={24} lg={18}>
          <Spin spinning={loading}>
            <KlineChart
              data={klineData}
              rayLines={rayLines}
              polymarketData={polymarketData}
              height={600}
            />
          </Spin>
        </Col>

        <Col xs={24} lg={6}>
          <RayLineConfig
            rayLines={rayLines}
            onChange={setRayLines}
            currentPrice={priceInfo?.lastPrice}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ChartPage;
