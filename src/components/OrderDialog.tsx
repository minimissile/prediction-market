import React, { useState, useEffect } from 'react';
import {
  Modal,
  Select,
  InputNumber,
  Input,
  Button,
  Alert,
  Space,
  Radio,
  message,
  Descriptions,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { TimeInterval, SymbolConfig } from '@/types';
import { POLYMARKET_INTERVALS } from '@/config';
import { placeOrder } from '@/services/orderService';
import { savePrivateKey, loadPrivateKey, clearPrivateKey } from '@/utils/cryptoUtils';

interface OrderDialogProps {
  open: boolean;
  onClose: () => void;
  symbol: SymbolConfig;
}

const OrderDialog: React.FC<OrderDialogProps> = ({ open, onClose, symbol }) => {
  const [interval, setInterval] = useState<TimeInterval>('1h');
  const [direction, setDirection] = useState<'Up' | 'Down'>('Up');
  const [amount, setAmount] = useState<number | null>(10);
  const [privateKey, setPrivateKey] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [loading, setLoading] = useState(false);

  // 加载缓存的私钥
  useEffect(() => {
    if (open) {
      const stored = loadPrivateKey();
      if (stored) {
        setPrivateKey(stored);
        setHasStoredKey(true);
      }
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!privateKey.trim()) {
      message.error('请输入钱包私钥');
      return;
    }
    if (!amount || amount <= 0) {
      message.error('请输入有效金额');
      return;
    }

    // 缓存私钥
    savePrivateKey(privateKey.trim());
    setHasStoredKey(true);

    setLoading(true);
    try {
      const result = await placeOrder({
        symbol: symbol.baseAsset,
        interval,
        direction,
        amount,
        privateKey: privateKey.trim(),
      });

      if (result.success) {
        message.success(result.message);
        onClose();
      } else {
        message.error(result.message);
      }
    } catch {
      message.error('下单请求异常');
    } finally {
      setLoading(false);
    }
  };

  const handleClearKey = () => {
    clearPrivateKey();
    setPrivateKey('');
    setHasStoredKey(false);
    message.info('已清除缓存的私钥');
  };

  return (
    <Modal
      title={`下单 - ${symbol.displayName}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={440}
      destroyOnClose
      styles={{
        header: { background: '#1a1a2e', borderBottom: '1px solid #2a2a3e' },
        body: { background: '#1a1a2e' },
        content: { background: '#1a1a2e' },
      }}
    >
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 预测周期 */}
        <Descriptions column={1} size="small" colon={false}>
          <Descriptions.Item
            label={<span style={{ color: '#888', width: 70, display: 'inline-block' }}>预测周期</span>}
          >
            <Select
              value={interval}
              onChange={setInterval}
              style={{ width: '100%' }}
              options={POLYMARKET_INTERVALS.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            />
          </Descriptions.Item>
        </Descriptions>

        {/* 方向选择 */}
        <div>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>预测方向</div>
          <Radio.Group
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space style={{ width: '100%' }}>
              <Radio.Button
                value="Up"
                style={{
                  width: 180,
                  textAlign: 'center',
                  background: direction === 'Up' ? '#26a69a20' : undefined,
                  borderColor: direction === 'Up' ? '#26a69a' : undefined,
                  color: direction === 'Up' ? '#26a69a' : undefined,
                }}
              >
                <ArrowUpOutlined /> Up (涨)
              </Radio.Button>
              <Radio.Button
                value="Down"
                style={{
                  width: 180,
                  textAlign: 'center',
                  background: direction === 'Down' ? '#ef535020' : undefined,
                  borderColor: direction === 'Down' ? '#ef5350' : undefined,
                  color: direction === 'Down' ? '#ef5350' : undefined,
                }}
              >
                <ArrowDownOutlined /> Down (跌)
              </Radio.Button>
            </Space>
          </Radio.Group>
        </div>

        {/* 金额输入 */}
        <div>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>下单金额 (USDC)</div>
          <InputNumber
            value={amount}
            onChange={setAmount}
            min={1}
            max={100000}
            step={10}
            precision={2}
            style={{ width: '100%' }}
            addonAfter="USDC"
            placeholder="输入下单金额"
          />
        </div>

        {/* 私钥输入 */}
        <div>
          <div
            style={{
              color: '#888',
              fontSize: 13,
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Polygon 钱包私钥</span>
            {hasStoredKey && (
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleClearKey}
                style={{ padding: 0, height: 'auto', fontSize: 12 }}
              >
                清除缓存
              </Button>
            )}
          </div>
          <Input.Password
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="输入您的 Polygon 钱包私钥"
            autoComplete="new-password"
            name="pm-pk-field"
          />
        </div>

        {/* 风险提示 */}
        <Alert
          type="warning"
          showIcon
          message="风险提示"
          description="私钥仅存储在本地浏览器中（混淆加密），请确保在安全环境下使用。下单后资金将直接通过 Polymarket CLOB 进行交易。"
          style={{ marginTop: 4 }}
        />

        {/* 提交按钮 */}
        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          onClick={handleSubmit}
          style={{
            marginTop: 4,
            background: direction === 'Up' ? '#26a69a' : '#ef5350',
            borderColor: direction === 'Up' ? '#26a69a' : '#ef5350',
            fontWeight: 600,
          }}
        >
          {direction === 'Up' ? '买入 Up (看涨)' : '买入 Down (看跌)'} - ${amount || 0} USDC
        </Button>
      </div>
      </form>
    </Modal>
  );
};

export default OrderDialog;
