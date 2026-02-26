import React, { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  Time,
  CrosshairMode,
} from 'lightweight-charts';
import type { KlineData, RayLine, PolymarketData } from '@/types';
import { CHART_COLORS } from '@/config';
import './KlineChart.css';

interface KlineChartProps {
  data: KlineData[];
  rayLines?: RayLine[];
  polymarketData?: PolymarketData[];
  height?: number;
  onCrosshairMove?: (price: number | null, time: Time | null) => void;
}

const KlineChart: React.FC<KlineChartProps> = ({
  data,
  rayLines = [],
  polymarketData = [],
  height = 500,
  onCrosshairMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const polymarketSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rayLinesRef = useRef<ISeriesApi<'Line'>[]>([]);

  // 初始化图表
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: CHART_COLORS.background },
        textColor: CHART_COLORS.text,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // 创建K线系列
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: CHART_COLORS.upColor,
      downColor: CHART_COLORS.downColor,
      borderUpColor: CHART_COLORS.borderUpColor,
      borderDownColor: CHART_COLORS.borderDownColor,
      wickUpColor: CHART_COLORS.wickUpColor,
      wickDownColor: CHART_COLORS.wickDownColor,
    });
    candlestickSeriesRef.current = candlestickSeries;

    // 创建成交量系列
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // 监听十字线移动
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (param.time && candlestickSeriesRef.current) {
          const data = param.seriesData.get(candlestickSeriesRef.current) as
            | CandlestickData
            | undefined;
          onCrosshairMove(data?.close ?? null, param.time);
        } else {
          onCrosshairMove(null, null);
        }
      });
    }

    // 响应窗口大小变化
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height, onCrosshairMove]);

  // 更新K线数据
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || data.length === 0) return;

    const chartData: CandlestickData[] = data.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = data.map((d) => ({
      time: d.time as Time,
      value: d.volume,
      color: d.close >= d.open ? CHART_COLORS.upColor : CHART_COLORS.downColor,
    }));

    candlestickSeriesRef.current.setData(chartData);
    volumeSeriesRef.current.setData(volumeData);

    // 自适应显示范围
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  // 更新射线
  const updateRayLines = useCallback(() => {
    if (!chartRef.current || data.length === 0) return;

    // 移除旧的射线
    rayLinesRef.current.forEach((series) => {
      chartRef.current?.removeSeries(series);
    });
    rayLinesRef.current = [];

    // 添加新的射线
    rayLines.forEach((ray) => {
      if (!chartRef.current) return;

      const lineSeries = chartRef.current.addLineSeries({
        color: ray.color,
        lineWidth: (ray.lineWidth || 1) as 1 | 2 | 3 | 4,
        lineStyle: ray.lineStyle === 'dashed' ? 1 : ray.lineStyle === 'dotted' ? 2 : 0,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: false,
      });

      // 创建从第一个数据点到最后一个数据点的水平线
      const firstTime = data[0]?.time;
      const lastTime = data[data.length - 1]?.time;

      if (firstTime !== undefined && lastTime !== undefined) {
        const lineData: LineData[] = [
          { time: firstTime as Time, value: ray.price },
          { time: lastTime as Time, value: ray.price },
        ];
        lineSeries.setData(lineData);
      }

      rayLinesRef.current.push(lineSeries);
    });
  }, [data, rayLines]);

  useEffect(() => {
    updateRayLines();
  }, [updateRayLines]);

  // 更新Polymarket数据叠加
  useEffect(() => {
    if (!chartRef.current) return;

    // 移除旧的Polymarket系列
    if (polymarketSeriesRef.current) {
      chartRef.current.removeSeries(polymarketSeriesRef.current);
      polymarketSeriesRef.current = null;
    }

    // 如果有Polymarket数据，创建新的系列
    if (polymarketData.length > 0) {
      const polymarketSeries = chartRef.current.addLineSeries({
        color: '#ff9800',
        lineWidth: 2,
        priceScaleId: 'polymarket',
        priceFormat: {
          type: 'percent',
        },
      });

      polymarketSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      });

      const lineData: LineData[] = polymarketData.map((d) => ({
        time: d.time as Time,
        value: d.probability * 100, // 转换为百分比
      }));

      polymarketSeries.setData(lineData);
      polymarketSeriesRef.current = polymarketSeries;
    }
  }, [polymarketData]);

  return <div ref={containerRef} className="kline-chart-container" />;
};

export default KlineChart;
