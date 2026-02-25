import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Alert } from 'antd';
import { KlineChart, RayLineConfig, ChartControls } from '@/components';
import { useKlineData } from '@/hooks/useKlineData';
import { get24hrTicker } from '@/services/binanceService';
import { getMockPredictionData } from '@/services/polymarketService';
import { DEFAULT_SYMBOL, DEFAULT_INTERVAL } from '@/config';
import type { SymbolConfig, TimeInterval, RayLine, PolymarketData } from '@/types';

const ChartPage: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolConfig>(DEFAULT_SYMBOL);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(DEFAULT_INTERVAL);
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
      // 使用模拟数据演示
      const mockData = getMockPredictionData(
        selectedSymbol.symbol,
        priceInfo?.lastPrice || 0
      );
      setPolymarketData(mockData);
    } else {
      setPolymarketData([]);
    }
  }, [showPolymarket, selectedSymbol, priceInfo?.lastPrice]);

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
            showPolymarket={showPolymarket}
            onSymbolChange={handleSymbolChange}
            onIntervalChange={setSelectedInterval}
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
