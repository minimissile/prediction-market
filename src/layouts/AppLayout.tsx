import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

const AppLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ background: '#0d0d1a' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default AppLayout;
