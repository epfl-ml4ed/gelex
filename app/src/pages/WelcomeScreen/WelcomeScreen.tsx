import React from 'react';
import { List, Button, Typography } from 'antd';
import { ArrowUpOutlined, CoffeeOutlined, InfoCircleOutlined, SettingOutlined, SmileOutlined } from '@ant-design/icons';
import './WelcomeScreen.css';

type WelcomeScreenProps = {
  onMenuSelect: (menu: string) => void;
  toggleDarkMode: () => void;
  className?: string;
  isDarkMode: boolean;
};

const menuItems = [
  { key: 'app', label: 'Start Cooking', icon: <CoffeeOutlined /> },
  { key: 'about', label: 'About Us', icon: <InfoCircleOutlined /> },
  { key: 'toggle', label: 'Toggle Dark Mode', icon: <SettingOutlined /> },
];

const { Text } = Typography;

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onMenuSelect, toggleDarkMode, className, isDarkMode }) => {
  return (
    <div className={`welcome-screen ${className}`} data-theme={isDarkMode ? 'dark' : 'light'}>
      <Text className='menu-info-text'><ArrowUpOutlined /> PS: (hover here to resummon me) <ArrowUpOutlined /></Text>
      <List
        header={<div>Welcome to Gen-AI Kitchen!</div>}
        dataSource={menuItems}
        className='menu-list'
        renderItem={item => (
          <List.Item>
            <Button
              type="link"
              size="large"
              icon={item.icon}
              onClick={() => item.key === 'toggle' ? toggleDarkMode() : onMenuSelect(item.key)}
              className="menu-item-button"
            >
              {item.label}
            </Button>
          </List.Item>
        )}
      />
    </div>
  );
};

export default WelcomeScreen;
