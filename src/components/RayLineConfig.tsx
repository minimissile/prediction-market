import React, { useState } from 'react';
import { Card, Input, Button, ColorPicker, List, Space, InputNumber, Select, Popconfirm } from 'antd';
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

const RayLineConfig: React.FC<RayLineConfigProps> = ({
  rayLines,
  onChange,
  currentPrice,
}) => {
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
    onChange(
      rayLines.map((ray) =>
        ray.id === id ? { ...ray, ...updates } : ray
      )
    );
  };

  return (
    <Card title="射线配置" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 添加新射线 */}
        <Space wrap>
          <InputNumber
            placeholder="价格"
            value={newPrice}
            onChange={(value) => setNewPrice(value)}
            style={{ width: 120 }}
            precision={2}
          />
          <ColorPicker
            value={newColor}
            onChange={(color) => setNewColor(color.toHexString())}
            size="small"
          />
          <Input
            placeholder="标签(可选)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            style={{ width: 100 }}
          />
          <Select
            value={newLineStyle}
            onChange={setNewLineStyle}
            options={lineStyleOptions}
            style={{ width: 80 }}
            size="small"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={newPrice === null}
            size="small"
          >
            添加
          </Button>
        </Space>

        {/* 当前价格快捷添加 */}
        {currentPrice && (
          <Button
            type="dashed"
            size="small"
            onClick={() => setNewPrice(currentPrice)}
          >
            使用当前价格: ${currentPrice.toLocaleString()}
          </Button>
        )}

        {/* 已添加的射线列表 */}
        {rayLines.length > 0 && (
          <List
            size="small"
            dataSource={rayLines}
            renderItem={(ray) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="delete"
                    title="确定删除此射线？"
                    onConfirm={() => handleRemove(ray.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                    />
                  </Popconfirm>,
                ]}
              >
                <Space>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: ray.color,
                      borderRadius: 2,
                    }}
                  />
                  <span>{ray.label}</span>
                  <InputNumber
                    value={ray.price}
                    onChange={(value) =>
                      value && handleUpdateRay(ray.id, { price: value })
                    }
                    size="small"
                    style={{ width: 100 }}
                  />
                </Space>
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );
};

export default RayLineConfig;
