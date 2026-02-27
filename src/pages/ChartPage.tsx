/**
 * ChartPage - 图表页面
 * 展示K线图表、Polymarket预测数据，提供设置侧栏和下单功能
 */
import React, { useState, useEffect, useRef } from 'react';
import { Spin, Alert, Collapse, Tag, Switch, Drawer, FloatButton } from 'antd';
import { SettingOutlined, TransactionOutlined } from '@ant-design/icons';
import { KlineChart, ChartControls, OrderDialog } from '@/components';
import { useKlineData } from '@/hooks/useKlineData';
import { get24hrTicker } from '@/services/binanceService';
import { getMultiIntervalOpenPrices, getClobProbabilities } from '@/services/polymarketService';
import { DEFAULT_SYMBOL, DEFAULT_INTERVAL } from '@/config';
import type { SymbolConfig, TimeInterval, RayLine } from '@/types';

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
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(
    () => (localStorage.getItem('pm_kline_interval') as TimeInterval) || DEFAULT_INTERVAL
  );
  const [rayLines, setRayLines] = useState<RayLine[]>([]);
  const [showPolymarket] = useState(true);
  const [visibleIntervals, setVisibleIntervals] = useState<Record<TimeInterval, boolean>>({
    '5m': true,
    '15m': true,
    '1h': true,
    '4h': true,
    '1d': true,
  } as Record<TimeInterval, boolean>);
  const [polymarketOpenPrices, setPolymarketOpenPrices] = useState<
    {
      interval: TimeInterval;
      openPrice: number;
      label: string;
      endTime: number;
      probability: number;
      upTokenId: string;
    }[]
  >([]);
  const [countdowns, setCountdowns] = useState<Record<TimeInterval, string>>({} as Record<TimeInterval, string>);
  const [priceInfo, setPriceInfo] = useState<{
    lastPrice: number;
    priceChange: number;
    priceChangePercent: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const prevShowPolymarket = useRef(showPolymarket);
  const prevVisibleIntervals = useRef(visibleIntervals);

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

  // 数据刷新函数引用
  const fetchPolymarketDataRef = useRef<(() => Promise<void>) | null>(null);

  // 获取 Polymarket 预测数据（隐含价格 + 各周期开盘价）
  useEffect(() => {
    if (!showPolymarket || !selectedSymbol.polymarketSlug) {
      setPolymarketOpenPrices([]);
      return;
    }

    // 切换币种时立即清空旧数据
    setPolymarketOpenPrices([]);

    let cancelled = false;

    const fetchData = async () => {
      try {
        const result = await getMultiIntervalOpenPrices(
          selectedSymbol.baseAsset,
          POLYMARKET_DEFAULT_INTERVALS
        );
        if (!cancelled && result) {
          setPolymarketOpenPrices(result);
        }
      } catch (err) {
        console.error('Failed to fetch Polymarket data:', err);
      }
    };

    // 保存引用以便倒计时结束时调用
    fetchPolymarketDataRef.current = fetchData;

    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分钟刷新
    return () => {
      cancelled = true;
      clearInterval(interval);
      fetchPolymarketDataRef.current = null;
    };
  }, [showPolymarket, selectedSymbol]);

  // 更新倒计时，检测周期结束时立即刷新
  const lastExpiredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (polymarketOpenPrices.length === 0) return;

    const updateCountdowns = () => {
      const now = Date.now();
      const newCountdowns: Record<TimeInterval, string> = {} as Record<TimeInterval, string>;
      let hasNewExpired = false;

      polymarketOpenPrices.forEach((item) => {
        const remaining = Math.max(0, item.endTime - now);
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        if (hours > 0) {
          newCountdowns[item.interval] = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
          newCountdowns[item.interval] = `${minutes}:${String(seconds).padStart(2, '0')}`;
        }

        // 检测周期是否刚结束
        const key = `${item.interval}-${item.endTime}`;
        if (remaining <= 0 && !lastExpiredRef.current.has(key)) {
          lastExpiredRef.current.add(key);
          hasNewExpired = true;
        }
      });

      setCountdowns(newCountdowns);

      // 有周期刚结束，延迟 1 秒后刷新数据（等待新周期数据可用）
      if (hasNewExpired && fetchPolymarketDataRef.current) {
        setTimeout(() => {
          fetchPolymarketDataRef.current?.();
        }, 1000);
      }
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [polymarketOpenPrices]);

  // 侧栏展开时，每秒通过 CLOB API 更新实时成交价
  const tokenIdsKey = polymarketOpenPrices.map((item) => item.upTokenId).join(',');

  useEffect(() => {
    if (!drawerOpen || !showPolymarket || polymarketOpenPrices.length === 0) return;

    const tokenEntries = polymarketOpenPrices
      .filter((item) => item.upTokenId)
      .map((item) => ({ interval: item.interval, tokenId: item.upTokenId }));

    if (tokenEntries.length === 0) return;

    let cancelled = false;

    const fetchProbabilities = async () => {
      try {
        const probMap = await getClobProbabilities(tokenEntries);
        if (cancelled) return;

        setPolymarketOpenPrices((prev) =>
          prev.map((item) => ({
            ...item,
            probability: probMap[item.interval] ?? item.probability,
          }))
        );
      } catch (err) {
        console.error('Failed to fetch probabilities:', err);
      }
    };

    fetchProbabilities();
    const interval = setInterval(fetchProbabilities, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [drawerOpen, showPolymarket, tokenIdsKey]);

  // 处理Polymarket多周期开盘价射线
  useEffect(() => {
    if (showPolymarket && polymarketOpenPrices.length > 0) {
      setRayLines((prev) => {
        const filtered = prev.filter((ray) => !ray.id.startsWith(POLYMARKET_RAY_PREFIX));
        const polymarketRays: RayLine[] = polymarketOpenPrices
          .filter((item) => visibleIntervals[item.interval])
          .map((item) => ({
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

    if (!showPolymarket && prevShowPolymarket.current) {
      setRayLines((prev) => prev.filter((ray) => !ray.id.startsWith(POLYMARKET_RAY_PREFIX)));
    }

    prevShowPolymarket.current = showPolymarket;
    prevVisibleIntervals.current = visibleIntervals;
  }, [showPolymarket, visibleIntervals, polymarketOpenPrices]);

  const handleSymbolChange = (symbol: SymbolConfig) => {
    setSelectedSymbol(symbol);
    setRayLines((prev) => prev.filter((ray) => ray.id.startsWith(POLYMARKET_RAY_PREFIX)));
  };

  if (error) {
    return <Alert message="数据加载失败" description={error.message} type="error" showIcon />;
  }

  return (
    <div
      style={{
        padding: '8px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        marginRight: drawerOpen ? 320 : 0,
        transition: 'margin-right 0.3s ease',
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <ChartControls
          selectedSymbol={selectedSymbol}
          selectedInterval={selectedInterval}
          onSymbolChange={handleSymbolChange}
          onIntervalChange={(val: TimeInterval) => {
            setSelectedInterval(val);
            localStorage.setItem('pm_kline_interval', val);
          }}
          priceInfo={priceInfo}
        />
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <Spin spinning={loading} style={{ height: '100%' }}>
          <KlineChart
            data={klineData}
            rayLines={rayLines}
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

      {/* 下单按钮 */}
      <FloatButton
        icon={<TransactionOutlined />}
        type="primary"
        style={{ right: 24, bottom: 90 }}
        onClick={() => setOrderDialogOpen(true)}
      />

      {/* 下单弹窗 */}
      <OrderDialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        symbol={selectedSymbol}
      />

      {/* 侧边栏 */}
      <Drawer
        title="设置"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={320}
        mask={false}
        push={false}
        styles={{
          header: { background: '#1a1a2e', borderBottom: '1px solid #2a2a3e' },
          body: { background: '#1a1a2e', padding: 0 },
          wrapper: { boxShadow: '-2px 0 8px rgba(0,0,0,0.3)' },
        }}
      >
        <Collapse
          defaultActiveKey={['rayline', 'polymarket']}
          size="small"
          bordered={false}
          style={{ background: 'transparent' }}
          items={[
            ...(showPolymarket && polymarketOpenPrices.length > 0
              ? [
                  {
                    key: 'polymarket',
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ color: '#fa8c16' }}>
                          Polymarket 开盘价
                          <Tag color="gold" style={{ marginLeft: 8, fontSize: 12 }}>
                            {selectedSymbol.displayName}
                          </Tag>
                        </span>
                        <Switch
                          size="small"
                          checked={Object.values(visibleIntervals).some(Boolean)}
                          onClick={(_, e) => e.stopPropagation()}
                          onChange={(checked) => {
                            const updated = { ...visibleIntervals } as Record<TimeInterval, boolean>;
                            for (const key of Object.keys(updated)) {
                              updated[key as TimeInterval] = checked;
                            }
                            setVisibleIntervals(updated);
                          }}
                          style={{ marginRight: 8 }}
                        />
                      </div>
                    ),
                    children: (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {polymarketOpenPrices.map((item) => {
                          const isVisible = visibleIntervals[item.interval];
                          return (
                            <div
                              key={item.interval}
                              style={{
                                padding: '10px 12px',
                                borderRadius: 6,
                                background: isVisible ? 'rgba(255,255,255,0.04)' : 'transparent',
                                border: `1px solid ${isVisible ? INTERVAL_COLORS[item.interval] + '40' : '#2a2a3e'}`,
                                transition: 'all 0.2s ease',
                                opacity: isVisible ? 1 : 0.5,
                              }}
                            >
                              {/* 第一行: 开关 + 周期标签 + 开盘价 */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: 8,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Switch
                                    size="small"
                                    checked={isVisible}
                                    onChange={(checked) =>
                                      setVisibleIntervals((prev) => ({
                                        ...prev,
                                        [item.interval]: checked,
                                      }))
                                    }
                                  />
                                  <div
                                    style={{
                                      width: 4,
                                      height: 20,
                                      borderRadius: 2,
                                      background: INTERVAL_COLORS[item.interval],
                                    }}
                                  />
                                  <Tag
                                    color={INTERVAL_COLORS[item.interval]}
                                    style={{ margin: 0 }}
                                  >
                                    {item.label}
                                  </Tag>
                                </div>
                                <span
                                  style={{
                                    color: '#fff',
                                    fontWeight: 500,
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  ${item.openPrice.toLocaleString()}
                                </span>
                              </div>
                              {/* 第二行: 倒计时 + 预测百分比 */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingLeft: 28,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 11, color: '#888' }}>剩余</span>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      color: '#52c41a',
                                      fontFamily: 'monospace',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {countdowns[item.interval] || '--:--'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 11, color: '#888' }}>成交价</span>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      color: item.probability >= 50 ? '#52c41a' : '#ff4d4f',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {item.probability}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
