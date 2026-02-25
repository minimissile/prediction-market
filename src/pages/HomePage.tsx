import React from 'react';
import { Card, Typography, Row, Col, Button } from 'antd';
import { LineChartOutlined, SettingOutlined, ApiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <LineChartOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: 'K线图表',
      description: '专业级K线图表，支持多种技术指标和时间周期',
    },
    {
      icon: <SettingOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      title: '自定义射线',
      description: '灵活添加价格参考线，支持自定义颜色和样式',
    },
    {
      icon: <ApiOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      title: '多数据源',
      description: '集成币安实时数据和Polymarket预测市场',
    },
  ];

  return (
    <div style={{ padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Title level={1}>K线图表展示工具</Title>
        <Paragraph style={{ fontSize: 16, color: '#666' }}>
          专业的加密货币K线图表分析工具，集成多数据源和预测市场数据
        </Paragraph>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/chart')}
          style={{ marginTop: 24 }}
        >
          开始使用
        </Button>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {features.map((feature, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: '100%' }}
              bodyStyle={{ padding: '32px 24px' }}
            >
              {feature.icon}
              <Title level={4} style={{ marginTop: 16 }}>
                {feature.title}
              </Title>
              <Paragraph type="secondary">{feature.description}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Title level={3}>支持的加密货币</Title>
        <Row gutter={[16, 16]} justify="center" style={{ marginTop: 24 }}>
          {['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE'].map((coin) => (
            <Col key={coin}>
              <Button shape="round">{coin}/USDT</Button>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default HomePage;
