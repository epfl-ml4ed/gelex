import React, { useMemo, useState } from 'react';
import { Menu, Switch, theme, Popover } from 'antd';
import { BulbOutlined, BulbFilled, FormOutlined, UserOutlined } from '@ant-design/icons';
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
            <div id="header-tabs-switch">
                <Popover
                    content={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                >
                    <Switch
                        checkedChildren={<BulbOutlined />}
                        unCheckedChildren={<BulbFilled />}
                        checked={!isDarkMode}
                        onChange={() => {
                            // Save to cookie
                            document.cookie = `darkMode=${!isDarkMode}`;
                            setDarkMode(!isDarkMode);
                        }}
                    />
                </Popover>
            </div>
        );
    }, [isDarkMode, setDarkMode]);

    return (
        <Menu className='header-tabs' onClick={handleClick} selectedKeys={[current]} mode="horizontal">
            <Menu.Item key="about" id="header-tabs-about" icon={<UserOutlined />}>About Us</Menu.Item>
            <Menu.Item key="app" id="header-tabs-app" icon={<FormOutlined />}>Recipe Improver</Menu.Item>
            {darkModeToggle}

        </Menu>
    );
};

export default Header;
