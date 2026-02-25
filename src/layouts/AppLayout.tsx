import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { HomeOutlined, LineChartOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/chart',
      icon: <LineChartOutlined />,
      label: 'K线图表',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#1a1a2e',
          padding: '0 24px',
        }}
      >
        <Title
          level={4}
          style={{
            color: '#fff',
            margin: 0,
            marginRight: 48,
            whiteSpace: 'nowrap',
          }}
        >
          Prediction Market
        </Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            flex: 1,
            background: 'transparent',
          }}
        />
      </Header>
      <Content style={{ background: '#0d0d1a' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', background: '#1a1a2e', color: '#666' }}>
        Prediction Market Chart Tool - Built with React + TypeScript
      </Footer>
    </Layout>
  );
};

export default AppLayout;
