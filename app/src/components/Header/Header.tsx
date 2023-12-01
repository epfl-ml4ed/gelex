import React, { useState } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import './Header.css'

type HeaderProps = {
    onTabChange: (key: string) => void;
};

export const Header: React.FC<HeaderProps> = ({ onTabChange }) => {
    const [current, setCurrent] = useState<string>('app');

    const handleClick: MenuProps['onClick'] = (e) => {
        setCurrent(e.key);
        onTabChange(e.key);
    };

    return (
        <Menu className='header-tabs' onClick={handleClick} selectedKeys={[current]} mode="horizontal">
            <Menu.Item key="about">About Us</Menu.Item>
            <Menu.Item key="app">The App Itself</Menu.Item>
        </Menu>
    );
};

export default Header;