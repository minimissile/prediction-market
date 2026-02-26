import React from 'react';
import { Card, Select, Space, Typography, Divider } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import type { SymbolConfig, TimeInterval } from '@/types';
import { SYMBOLS, TIME_INTERVALS } from '@/config';

const { Text } = Typography;

interface ChartControlsProps {
  selectedSymbol: SymbolConfig;
  selectedInterval: TimeInterval;
  onSymbolChange: (symbol: SymbolConfig) => void;
  onIntervalChange: (interval: TimeInterval) => void;
  priceInfo?: {
    lastPrice: number;
    priceChange: number;
    priceChangePercent: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
  } | null;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  selectedSymbol,
  selectedInterval,
  onSymbolChange,
  onIntervalChange,
  priceInfo,
}) => {
  const symbolOptions = SYMBOLS.map((s) => ({
    value: s.symbol,
    label: s.displayName,
  }));

  const klineIntervalOptions = TIME_INTERVALS.map((i) => ({
    value: i.value,
    label: i.label,
  }));

  const handleSymbolChange = (value: string) => {
    const symbol = SYMBOLS.find((s) => s.symbol === value);
    if (symbol) {
      onSymbolChange(symbol);
    }
  };

  const isPositive = priceInfo && priceInfo.priceChange >= 0;

  return (
    <Card size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 币种选择和K线周期 */}
        <Space wrap>
          <Select
            value={selectedSymbol.symbol}
            onChange={handleSymbolChange}
            options={symbolOptions}
            style={{ width: 140 }}
          />
          <Divider type="vertical" />
          <Space>
            <LineChartOutlined style={{ color: '#1890ff' }} />
            <Text type="secondary">K线周期:</Text>
            <Select
              value={selectedInterval}
              onChange={onIntervalChange}
              options={klineIntervalOptions}
              style={{ width: 100 }}
            />
          </Space>
          {/* Polymarket控制已隐藏 */}
        </Space>

        {priceInfo && (
          <Space wrap size="large">
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                最新价格
              </Text>
              <Text strong style={{ fontSize: 18, color: isPositive ? '#26a69a' : '#ef5350' }}>
                $
                {priceInfo.lastPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: selectedSymbol.pricePrecision,
                })}
              </Text>
            </Space>
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                24h涨跌
              </Text>
              <Text style={{ color: isPositive ? '#26a69a' : '#ef5350' }}>
                {isPositive ? '+' : ''}
                {priceInfo.priceChange.toFixed(2)} ({isPositive ? '+' : ''}
                {priceInfo.priceChangePercent.toFixed(2)}%)
              </Text>
            </Space>
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                24h最高
              </Text>
              <Text>${priceInfo.highPrice.toLocaleString()}</Text>
            </Space>
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                24h最低
              </Text>
              <Text>${priceInfo.lowPrice.toLocaleString()}</Text>
            </Space>
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                24h成交量
              </Text>
              <Text>
                {(priceInfo.volume / 1000).toFixed(2)}K {selectedSymbol.baseAsset}
              </Text>
            </Space>
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default ChartControls;
