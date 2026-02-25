import { useState, useEffect, useCallback, useRef } from 'react';
import type { KlineData, TimeInterval } from '@/types';
import { getKlines, createKlineWebSocket } from '@/services/binanceService';

interface UseKlineDataOptions {
  symbol: string;
  interval: TimeInterval;
  limit?: number;
  enableRealtime?: boolean;
}

interface UseKlineDataResult {
  data: KlineData[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useKlineData({
  symbol,
  interval,
  limit = 500,
  enableRealtime = true,
}: UseKlineDataOptions): UseKlineDataResult {
  const [data, setData] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const klines = await getKlines(symbol, interval, limit);
      setData(klines);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch kline data'));
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, limit]);

  // 初始加载数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket实时更新
  useEffect(() => {
    if (!enableRealtime) return;

    // 关闭之前的连接
    if (wsRef.current) {
      wsRef.current.close();
    }

    // 创建新的WebSocket连接
    wsRef.current = createKlineWebSocket(symbol, interval, (newKline) => {
      setData((prevData) => {
        if (prevData.length === 0) return prevData;

        const lastKline = prevData[prevData.length - 1];
        
        // 如果是同一根K线，更新它
        if (lastKline && lastKline.time === newKline.time) {
          return [...prevData.slice(0, -1), newKline];
        }
        
        // 如果是新的K线，添加到末尾
        if (!lastKline || newKline.time > lastKline.time) {
          return [...prevData.slice(1), newKline];
        }

        return prevData;
      });
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, interval, enableRealtime]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
