import { Wallet } from '@ethersproject/wallet';
import { ClobClient, Side, Chain } from '@polymarket/clob-client';
import type { OrderRequest, OrderResult } from '@/types';
import { getMarketTokenIds } from './polymarketService';

const CLOB_HOST = '/api/clob';

/**
 * 下单到 Polymarket CLOB
 * 1. 从 markets API 获取 tokenId
 * 2. 用私钥创建 Wallet，初始化 ClobClient
 * 3. 派生 API Key 凭证
 * 4. 构建市价单并提交
 */
export async function placeOrder(request: OrderRequest): Promise<OrderResult> {
  const { symbol, interval, direction, amount, privateKey } = request;

  try {
    // 获取市场 tokenId
    const tokenInfo = await getMarketTokenIds(symbol, interval);
    if (!tokenInfo) {
      return { success: false, message: `未找到 ${symbol} ${interval} 的市场数据` };
    }

    const tokenId = direction === 'Up' ? tokenInfo.upTokenId : tokenInfo.downTokenId;
    if (!tokenId) {
      return { success: false, message: `未找到 ${direction} 方向的 tokenId` };
    }

    // 创建 ethers v5 Wallet
    const wallet = new Wallet(privateKey);

    // 初始化 ClobClient (L1 认证)
    const clobClient = new ClobClient(CLOB_HOST, Chain.POLYGON, wallet);

    // 派生 API Key 凭证 (L2 认证)
    const creds = await clobClient.createOrDeriveApiKey();

    // 使用 L2 凭证重新初始化客户端
    const authedClient = new ClobClient(CLOB_HOST, Chain.POLYGON, wallet, creds);

    // 提交市价单 (FOK: Fill or Kill)
    const resp = await authedClient.createAndPostMarketOrder({
      tokenID: tokenId,
      amount,
      side: Side.BUY,
    });

    if (resp && resp.orderID) {
      return {
        success: true,
        orderId: resp.orderID,
        message: `下单成功: ${direction} ${symbol} ${interval}, 金额 $${amount}`,
      };
    }

    // 有些响应格式不同
    if (resp && resp.success === false) {
      return {
        success: false,
        message: resp.errorMsg || '下单失败: 服务器返回错误',
      };
    }

    return {
      success: true,
      orderId: resp?.orderID || resp?.order_id || '',
      message: `下单已提交: ${direction} ${symbol} ${interval}, 金额 $${amount}`,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Order placement failed:', error);
    return { success: false, message: `下单失败: ${errMsg}` };
  }
}
