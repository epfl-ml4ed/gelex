import React from 'react';
import { List, Button, Typography } from 'antd';
import { ArrowUpOutlined, CoffeeOutlined, EditOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import './WelcomeScreen.css';

type WelcomeScreenProps = {
  onMenuSelect: (menu: string) => void;
  toggleDarkMode: () => void;
  className?: string;
  isDarkMode: boolean;
  currentMode: string;
  setCurrentMode?: (mode: string) => void;
};

const menuItems = [
  { key: 'app', label: 'Start Cooking', icon: <CoffeeOutlined /> },
  { key: 'about', label: 'About Us', icon: <InfoCircleOutlined /> },
  { key: 'toggle', label: 'Toggle Dark Mode', icon: <SettingOutlined /> },
];

const { Text } = Typography;

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onMenuSelect, toggleDarkMode, className, isDarkMode, currentMode, setCurrentMode }) => {


  const switchText = currentMode === 'word' ? 'sentence' : 'word';
  // Add one more element to the menuItems array
  const myMenuItems = [
    ...menuItems,
    { key: 'sentence-mode', label: `Switch to ${switchText} mode`, icon: <EditOutlined /> },
  ]

  const onClickHandler = (key: string) => {
    if (key === 'toggle'){
      toggleDarkMode();
    }
    else if (key === 'sentence-mode'){
      setCurrentMode && setCurrentMode(currentMode === 'word' ? 'sentence' : 'word');
    }
    else {
      onMenuSelect(key);
    }
  }

  return (
    <div className={`welcome-screen ${className}`} data-theme={isDarkMode ? 'dark' : 'light'}>
      <Text className='menu-info-text'><ArrowUpOutlined /> PS: (hover here to resummon me) <ArrowUpOutlined /></Text>
      <List
        header={<div>Welcome to Gen-AI Kitchen!</div>}
        dataSource={myMenuItems}
        className='menu-list'
        renderItem={item => (
          <List.Item>
            <Button
              type="link"
              size="large"
              icon={item.icon}
              onClick={() => onClickHandler(item.key)}
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
