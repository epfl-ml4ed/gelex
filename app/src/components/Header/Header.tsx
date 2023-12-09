import React, { useMemo, useState } from 'react';
import { Menu, Switch, Row, Col, theme } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './Header.css';

type HeaderProps = {
    onTabChange: (key: string) => void;
    setDarkMode: (isDarkMode: boolean) => void;
};

export const Header: React.FC<HeaderProps> = ({ onTabChange, setDarkMode }) => {
    const [current, setCurrent] = useState<string>('app');

    // Read dark mode from config
    const { theme: themeToken } = theme.useToken();
    const isDarkMode = themeToken.id === 1;
    console.log(isDarkMode);

    const handleClick: MenuProps['onClick'] = (e) => {
        setCurrent(e.key);
        onTabChange(e.key);
    };

    const darkModeToggle = useMemo(() => {
        return (
            <Switch
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<BulbOutlined />}
                checked={isDarkMode}
                onChange={() => {
                    // Save to cookie
                    document.cookie = `darkMode=${!isDarkMode}`;
                    setDarkMode(!isDarkMode);
                }}
                style={{ marginTop: 16 }}
            />
        );
    }, [isDarkMode, setDarkMode]);

    return (
        <Row align="middle" justify="space-between">
            <Col xs={24} sm={18} md={20} lg={21} xl={22}>
                <Menu className='header-tabs' onClick={handleClick} selectedKeys={[current]} mode="horizontal">
                    <Menu.Item key="about">About Us</Menu.Item>
                    <Menu.Item key="app">The App Itself</Menu.Item>
                </Menu>
            </Col>
            <Col xs={24} sm={6} md={4} lg={3} xl={2}>
                {darkModeToggle}
            </Col>
        </Row>
    );
};

export default Header;
