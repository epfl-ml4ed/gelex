import React, { useState } from 'react';
import { Col, Layout, Row, notification, theme  } from 'antd';
const { Content } = Layout;
import './App.css';
import { MainPage } from './pages';
import WelcomeScreen from './pages/WelcomeScreen/WelcomeScreen';


type AppProps = {
    setDarkMode: (isDarkMode: boolean) => void;
};

const App: React.FC<AppProps> = ({setDarkMode}) => {
    const [activeTab, setActiveTab] = useState<string>('welcome'); // Set 'welcome' as initial state
    const [showWelcomeScreen, setShowWelcomeScreen] = useState<boolean>(true); // Set 'welcome' as initial state

    // Read dark mode from config
    const { theme: themeToken } = theme.useToken();
    const isDarkMode = themeToken.id === 1;

    const handleToggleDarkMode = () => {
        document.cookie = `darkMode=${!isDarkMode}`;
        setDarkMode(!isDarkMode);
    };

    const [api, contextHolder] = notification.useNotification();
    const handleMenuSelect = (menu: string) => {
        setActiveTab(menu);
        // Delay hiding the WelcomeScreen to allow for animation
        setShowWelcomeScreen(false);
    };

    const handleHoverOverTop = () => {
        setShowWelcomeScreen(true);
    };

    return (
        <>
            <div className="hover-target-parent">
                <div className="hover-target" onMouseOver={handleHoverOverTop}/>
            </div>
            <Layout className="layout">
                {contextHolder}
                <WelcomeScreen 
                    className={showWelcomeScreen ? 'menu-enter' : 'menu-exit'}
                    onMenuSelect={handleMenuSelect} 
                    toggleDarkMode={handleToggleDarkMode} 
                    isDarkMode={isDarkMode}
                />
                <Content style={{ padding: '2rem 0' }}>
                    <Row>
                        <Col span={2}/>
                        <Col span={20}>
                            {activeTab === 'app' && <MainPage api={api} />}
                            {activeTab === 'about' && <p>About Us content</p>}
                        </Col>
                        <Col span={2}/>
                    </Row>

                </Content>
            </Layout>
        </>
    );
};

export default App;
