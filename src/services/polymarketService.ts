import axios from 'axios';
import type { PolymarketData } from '@/types';
import { API_CONFIG } from '@/config';

const polymarketApi = axios.create({
  baseURL: API_CONFIG.polymarket.baseUrl,
});

/**
 * 获取Polymarket市场数据
 * 注意: Polymarket API可能需要特定的认证或有访问限制
 */
export async function getMarketData(slug: string): Promise<PolymarketData[]> {
  try {
    // Polymarket CLOB API - 获取市场信息
    const response = await polymarketApi.get('/markets', {
      params: {
        slug,
      },
    });

    // 解析返回的数据
    // 注意: 实际API响应结构可能不同，需要根据真实API调整
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((item: { timestamp: number; probability: number; volume?: number }) => ({
        time: item.timestamp,
        probability: item.probability,
        volume: item.volume,
      }));
    }

    return [];
  } catch (error) {
    console.warn('Failed to fetch Polymarket data:', error);
    return [];
  }
}

/**
 * 获取市场详情
 */
export async function getMarketInfo(conditionId: string): Promise<{
  question: string;
  outcomes: string[];
  volume: number;
  liquidity: number;
} | null> {
  try {
    const response = await polymarketApi.get(`/markets/${conditionId}`);
    
    return {
      question: response.data.question,
      outcomes: response.data.outcomes,
      volume: response.data.volume,
      liquidity: response.data.liquidity,
    };
  } catch (error) {
    console.warn('Failed to fetch market info:', error);
    return null;
  }
}

/**
 * 模拟获取价格预测数据
 * 用于演示目的，实际应用中应对接真实API
 */
export function getMockPredictionData(
  _symbol: string,
  _targetPrice: number,
  dataPoints: number = 100
): PolymarketData[] {
  const now = Date.now() / 1000;
  const data: PolymarketData[] = [];
  
  for (let i = 0; i < dataPoints; i++) {
    const time = now - (dataPoints - i) * 3600; // 每小时一个数据点
    // 模拟概率数据，随时间波动
    const baseProbability = 0.5;
    const noise = Math.sin(i * 0.1) * 0.2 + Math.random() * 0.1 - 0.05;
    const probability = Math.max(0.1, Math.min(0.9, baseProbability + noise));
    
    data.push({
      time,
      probability,
      volume: Math.random() * 100000,
    });
  }
  
  return data;
}
