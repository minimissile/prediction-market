import React, { useEffect, useRef, useState } from 'react';
import { Card, Typography, Row, Col, Button, Space, Badge } from 'antd';
import {
  LineChartOutlined,
  SettingOutlined,
  ApiOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const { Title, Paragraph, Text } = Typography;

// 区块链节点动画组件
const BlockchainNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    pulsePhase: number;
  }>>([]);
  const blocksRef = useRef<Array<{
    x: number;
    y: number;
    size: number;
    rotation: number;
    speed: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化节点
    const nodeCount = 25;
    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 3 + 2,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // 初始化区块
    const blockCount = 8;
    blocksRef.current = Array.from({ length: blockCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 20 + 15,
      rotation: Math.random() * Math.PI * 2,
      speed: (Math.random() - 0.5) * 0.02,
    }));

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      ctx.fillStyle = 'rgba(13, 13, 26, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const blocks = blocksRef.current;

      // 绘制连接线
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        if (!nodeA) continue;
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          if (!nodeB) continue;
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
          }
        }
      }

      // 绘制数据流动效果
      if (frameCount % 3 === 0) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (!node) continue;
          const targetIndex = Math.floor(Math.random() * nodes.length);
          if (targetIndex !== i) {
            const target = nodes[targetIndex];
            if (!target) continue;
            const midX = (node.x + target.x) / 2;
            const midY = (node.y + target.y) / 2;
            ctx.beginPath();
            ctx.arc(midX, midY, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
            ctx.fill();
          }
        }
      }

      // 绘制节点
      nodes.forEach((node) => {
        // 更新位置
        node.x += node.vx;
        node.y += node.vy;
        node.pulsePhase += 0.05;

        // 边界反弹
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // 脉冲效果
        const pulseRadius = node.radius + Math.sin(node.pulsePhase) * 2;

        // 外圈光晕
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          pulseRadius * 3
        );
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // 节点核心
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 绘制区块
      blocks.forEach((block) => {
        block.rotation += block.speed;
        block.y += Math.sin(frameCount * 0.01 + block.x) * 0.3;

        ctx.save();
        ctx.translate(block.x, block.y);
        ctx.rotate(block.rotation);

        // 区块边框
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-block.size / 2, -block.size / 2, block.size, block.size);

        // 区块内部
        ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
        ctx.fillRect(-block.size / 2, -block.size / 2, block.size, block.size);

        // 区块哈希线
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-block.size / 2 + 5, -block.size / 2 + 8 + i * 6);
          ctx.lineTo(block.size / 2 - 5, -block.size / 2 + 8 + i * 6);
          ctx.stroke();
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="blockchain-network-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

// 浮动加密货币图标组件
const FloatingCoins: React.FC = () => {
  const coins = [
    { symbol: '₿', name: 'BTC', color: '#f7931a', delay: 0 },
    { symbol: 'Ξ', name: 'ETH', color: '#627eea', delay: 0.5 },
    { symbol: '◎', name: 'SOL', color: '#9945ff', delay: 1 },
    { symbol: '✕', name: 'XRP', color: '#23292f', delay: 1.5 },
    { symbol: '₳', name: 'ADA', color: '#0033ad', delay: 2 },
    { symbol: '◆', name: 'MATIC', color: '#8247e5', delay: 2.5 },
  ];

  return (
    <div className="floating-coins">
      {coins.map((coin, index) => (
        <div
          key={coin.name}
          className="floating-coin"
          style={{
            animationDelay: `${coin.delay}s`,
            left: `${15 + index * 15}%`,
            top: `${20 + (index % 2) * 50}%`,
          }}
        >
          <div
            className="coin-inner"
            style={{
              background: `linear-gradient(135deg, ${coin.color}40, ${coin.color}20)`,
              borderColor: `${coin.color}60`,
            }}
          >
            <span style={{ color: coin.color }}>{coin.symbol}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// 统计数据组件
const StatsSection: React.FC = () => {
  const stats = [
    { label: '支持币种', value: '50+', icon: <DatabaseOutlined /> },
    { label: '实时数据', value: '24/7', icon: <GlobalOutlined /> },
    { label: '安全交易', value: '100%', icon: <SafetyOutlined /> },
    { label: '毫秒响应', value: '<100ms', icon: <ThunderboltOutlined /> },
  ];

  return (
    <div className="stats-section">
      <Row gutter={[32, 24]} justify="center">
        {stats.map((stat, index) => (
          <Col key={index} xs={12} sm={6}>
            <div className="stat-item" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <LineChartOutlined />,
      title: '专业K线图表',
      description: '实时K线数据，支持多种技术指标和时间周期，精准把握市场脉搏',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    },
    {
      icon: <SettingOutlined />,
      title: '智能分析工具',
      description: '自定义射线、支撑阻力位标记，多维度技术分析助力决策',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
    {
      icon: <ApiOutlined />,
      title: '多源数据聚合',
      description: '整合币安实时行情与预测市场数据，全方位市场洞察',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
  ];

  const supportedCoins = [
    { name: 'BTC', fullName: 'Bitcoin', color: '#f7931a' },
    { name: 'ETH', fullName: 'Ethereum', color: '#627eea' },
    { name: 'SOL', fullName: 'Solana', color: '#9945ff' },
    { name: 'XRP', fullName: 'Ripple', color: '#23292f' },
    { name: 'BNB', fullName: 'BNB', color: '#f3ba2f' },
    { name: 'ADA', fullName: 'Cardano', color: '#0033ad' },
    { name: 'DOGE', fullName: 'Dogecoin', color: '#c2a633' },
    { name: 'DOT', fullName: 'Polkadot', color: '#e6007a' },
  ];

  return (
    <div className="homepage-container">
      <BlockchainNetwork />
      <FloatingCoins />

      {/* Hero Section */}
      <section className={`hero-section ${isVisible ? 'visible' : ''}`}>
        <div className="hero-content">
          <div className="hero-badge">
            <Badge.Ribbon text="Web3 Ready" color="cyan">
              <div className="badge-content">
                <span className="pulse-dot" />
                <Text style={{ color: '#22d3ee' }}>实时区块链数据</Text>
              </div>
            </Badge.Ribbon>
          </div>

          <Title level={1} className="hero-title">
            <span className="gradient-text">下一代</span>
            <br />
            <span className="outline-text">加密货币</span>
            <br />
            <span className="gradient-text">分析平台</span>
          </Title>

          <Paragraph className="hero-description">
            专业的K线图表分析工具，融合区块链技术
            <br />
            实时数据流、智能预测、多维度市场洞察
          </Paragraph>

          <Space size="large" className="hero-buttons">
            <Button
              type="primary"
              size="large"
              className="cta-button primary"
              onClick={() => navigate('/chart')}
            >
              开始分析
              <ArrowRightOutlined />
            </Button>
            <Button
              size="large"
              className="cta-button secondary"
              onClick={() => navigate('/chart')}
            >
              查看演示
            </Button>
          </Space>
        </div>

        {/* 装饰性元素 */}
        <div className="hero-decoration">
          <div className="glow-orb orb-1" />
          <div className="glow-orb orb-2" />
          <div className="glow-orb orb-3" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="section stats-wrapper">
        <StatsSection />
      </section>

      {/* Features Section */}
      <section className="section features-section">
        <div className="section-header">
          <Text className="section-label">核心功能</Text>
          <Title level={2} className="section-title">
            强大的<span className="highlight">分析工具</span>
          </Title>
        </div>

        <Row gutter={[32, 32]} justify="center">
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                className="feature-card"
                style={{ animationDelay: `${index * 0.15}s` }}
                bordered={false}
              >
                <div
                  className="feature-icon-wrapper"
                  style={{ background: feature.gradient }}
                >
                  {feature.icon}
                </div>
                <Title level={4} className="feature-title">
                  {feature.title}
                </Title>
                <Paragraph className="feature-description">
                  {feature.description}
                </Paragraph>
                <div className="feature-glow" style={{ background: feature.color }} />
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Supported Coins Section */}
      <section className="section coins-section">
        <div className="section-header">
          <Text className="section-label">市场覆盖</Text>
          <Title level={2} className="section-title">
            支持主流<span className="highlight">加密货币</span>
          </Title>
        </div>

        <div className="coins-marquee">
          <div className="coins-track">
            {[...supportedCoins, ...supportedCoins].map((coin, index) => (
              <div key={index} className="coin-badge">
                <div
                  className="coin-indicator"
                  style={{ backgroundColor: coin.color }}
                />
                <span className="coin-name">{coin.name}</span>
                <span className="coin-fullname">{coin.fullName}</span>
              </div>
            ))}
          </div>
        </div>

        <Row gutter={[16, 16]} justify="center" className="coins-grid">
          {supportedCoins.slice(0, 4).map((coin) => (
            <Col key={coin.name}>
              <div className="coin-card">
                <div
                  className="coin-icon"
                  style={{
                    background: `linear-gradient(135deg, ${coin.color}30, ${coin.color}10)`,
                    borderColor: `${coin.color}50`,
                  }}
                >
                  <span style={{ color: coin.color }}>{coin.name[0]}</span>
                </div>
                <div className="coin-info">
                  <Text strong style={{ color: '#fff' }}>
                    {coin.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {coin.fullName}
                  </Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="cta-card">
          <div className="cta-glow" />
          <Title level={2} className="cta-title">
            准备好探索市场了吗？
          </Title>
          <Paragraph className="cta-description">
            立即开始您的加密货币分析之旅，掌握市场先机
          </Paragraph>
          <Button
            type="primary"
            size="large"
            className="cta-button primary large"
            onClick={() => navigate('/chart')}
          >
            立即开始
            <ArrowRightOutlined />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <LineChartOutlined />
              <Text strong style={{ color: '#fff', fontSize: 18 }}>
                CryptoChart
              </Text>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 8 }}>
              专业的加密货币K线图表分析平台
            </Paragraph>
          </div>
          <div className="footer-links">
            <Text type="secondary">© 2026 CryptoChart. All rights reserved.</Text>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
