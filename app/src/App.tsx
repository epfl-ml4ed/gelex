import React, { useState } from 'react';
import { Col, Layout, Row, notification, theme  } from 'antd';
const { Content } = Layout;
import './App.css';
import { MainPage, ResultPage } from './pages';
import WelcomeScreen from './pages/WelcomeScreen/WelcomeScreen';


type AppProps = {
    setDarkMode: (isDarkMode: boolean) => void;
};

const App: React.FC<AppProps> = ({setDarkMode}) => {
    const [activeTab, setActiveTab] = useState<string>('welcome'); // Set 'welcome' as initial state
    const [showWelcomeScreen, setShowWelcomeScreen] = useState<boolean>(true); // Set 'welcome' as initial state
    // Does cookie for currentMode exist?
    // Read current mode from cookie
    const cookieCurrentMode = document.cookie.split(';').find((cookie) => cookie.includes('currentMode'))?.split('=')[1] || 'word';
    const [currentMode, setCurrentMode] = useState<string>(cookieCurrentMode); // Set 'word' as initial state
    // Set the cookie
    document.cookie = `currentMode=${currentMode}`;

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
                    currentMode={currentMode}
                    setCurrentMode={setCurrentMode}
                />
                <Content style={{ padding: '2rem 0' }}>
                    
                    <Row>
                        <Col span={2}/>
                        <Col span={20}>
                            {activeTab === 'app' && <MainPage api={api} setActivePage={handleMenuSelect} currentMode={currentMode}/>}
                            {activeTab === 'about' && <p>About Us content</p>}
                            {activeTab === 'result' && <ResultPage setActivePage={handleMenuSelect} />}
                        </Col>
                        <Col span={2}/>
                    </Row>

                </Content>
            </Layout>
        </>
    );
};

export default App;
