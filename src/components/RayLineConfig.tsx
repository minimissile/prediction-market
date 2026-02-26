/**
 * RayLineConfig - 射线配置组件
 * 用于管理图表上的自定义射线，支持添加、编辑、删除射线
 */
import React, { useState } from 'react';
import { Input, Button, ColorPicker, List, Space, InputNumber, Select, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { RayLine } from '@/types';

interface RayLineConfigProps {
  rayLines: RayLine[];
  onChange: (rayLines: RayLine[]) => void;
  currentPrice?: number;
}

const lineStyleOptions = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'dotted', label: '点线' },
];

const RayLineConfig: React.FC<RayLineConfigProps> = ({ rayLines, onChange, currentPrice }) => {
  const [newPrice, setNewPrice] = useState<number | null>(currentPrice || null);
  const [newColor, setNewColor] = useState('#ff9800');
  const [newLabel, setNewLabel] = useState('');
  const [newLineStyle, setNewLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');

  const handleAdd = () => {
    if (newPrice === null) return;

    const newRay: RayLine = {
      id: `ray-${Date.now()}`,
      price: newPrice,
      color: newColor,
      label: newLabel || `$${newPrice.toLocaleString()}`,
      lineStyle: newLineStyle,
      lineWidth: 1,
    };

    onChange([...rayLines, newRay]);
    setNewPrice(null);
    setNewLabel('');
  };

  const handleRemove = (id: string) => {
    onChange(rayLines.filter((ray) => ray.id !== id));
  };

  const handleUpdateRay = (id: string, updates: Partial<RayLine>) => {
    onChange(rayLines.map((ray) => (ray.id === id ? { ...ray, ...updates } : ray)));
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      {/* 当前价格快捷添加 */}
      {currentPrice && (
        <Button type="dashed" size="small" block onClick={() => setNewPrice(currentPrice)}>
          当前价格: ${currentPrice.toLocaleString()}
        </Button>
      )}

      {/* 添加新射线 */}
      <Space direction="vertical" style={{ width: '100%' }} size={4}>
        <InputNumber
          placeholder="价格"
          value={newPrice}
          onChange={(value) => setNewPrice(value)}
          style={{ width: '100%' }}
          precision={2}
          size="small"
        />
        <Space style={{ width: '100%' }}>
          <ColorPicker
            value={newColor}
            onChange={(color) => setNewColor(color.toHexString())}
            size="small"
          />
          <Select
            value={newLineStyle}
            onChange={setNewLineStyle}
            options={lineStyleOptions}
            style={{ flex: 1 }}
            size="small"
          />
        </Space>
        <Input
          placeholder="标签(可选)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          size="small"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          disabled={newPrice === null}
          size="small"
          block
        >
          添加射线
        </Button>
      </Space>

      {/* 已添加的射线列表 */}
      {rayLines.length > 0 && (
        <List
          size="small"
          dataSource={rayLines}
          style={{ marginTop: 8 }}
          renderItem={(ray) => (
            <List.Item
              style={{ padding: '4px 0' }}
              actions={[
                <Popconfirm
                  key="delete"
                  title="确定删除？"
                  onConfirm={() => handleRemove(ray.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>,
              ]}
            >
              <Space size={4}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: ray.color,
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <InputNumber
                  value={ray.price}
                  onChange={(value) => value && handleUpdateRay(ray.id, { price: value })}
                  size="small"
                  style={{ width: 90 }}
                />
              </Space>
            </List.Item>
          )}
        />
      )}
    </Space>
  );
};

export default RayLineConfig;
