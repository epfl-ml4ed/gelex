import React, { useContext, useEffect, useRef } from 'react';
import { List, Button, Typography } from 'antd';
import { ArrowUpOutlined, CoffeeOutlined, EditOutlined, InfoCircleOutlined, QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons';
import './WelcomeScreen.css';
import { IPageRef, TourContext } from '../../components';

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
    { key: 'tour', label: 'Restart Tour', icon: <QuestionCircleOutlined /> },
  ]
  const { startTour, doTour, setDoTour, currentPage, setCurrentPage } = useContext(TourContext);

  const onClickHandler = (key: string) => {
    if (key === 'toggle'){
      toggleDarkMode();
    }
    else if (key === 'sentence-mode' && !doTour){
      setCurrentMode && setCurrentMode(currentMode === 'word' ? 'sentence' : 'word');
    }
    else if (key === 'tour'){
      setDoTour(true);
    }
    else {
      if(key !== 'app' && doTour) return;
      onMenuSelect(key);
    }
  }
  
  // Ref Map
  const refMap: Record<string, React.RefObject<HTMLDivElement>> = {};
  refMap['welcome'] = useRef<HTMLDivElement>(null);
  refMap['app'] = useRef<HTMLDivElement>(null);
  refMap['about'] = useRef<HTMLDivElement>(null);
  refMap['toggle'] = useRef<HTMLDivElement>(null);
  refMap['sentence-mode'] = useRef<HTMLDivElement>(null);
  refMap['tour'] = useRef<HTMLDivElement>(null);
  refMap['empty'] = useRef<HTMLDivElement>(null);

  const createFirstStep = () => {
    const refs:IPageRef[] = []
    refs.push({
      title: 'Welcome!',
      content: `Welcome to Gen-AI Kitchen! This was conceived as a semester project at ML4ED Lab at EPFL.
      Since this is your first time visiting (or re-requesting a tour), let us show you around!`,
      target: refMap.empty,
      onClose: () => { refMap.app.current?.click(); }
    });
    refs.push({
      title: 'Welcome screen!',
      content: `This is the welcome screen. This is what you'll be using to navigate around the app.`,
      target: refMap.welcome,
      onClose: () => { refMap.app.current?.click(); }
    });
    refs.push({
      title: 'Start Cooking',
      content: 'Click here to go to app and start cooking!',
      target: refMap.app,
      onClose: () => { refMap.app.current?.click(); }    
    });
    refs.push({
      title: 'About Us',
      content: 'Click here to learn more about us!',
      target: refMap.about,
      onClose: () => { refMap.app.current?.click(); }    
    });
    refs.push({
      title: 'Toggle Dark Mode',
      content: 'Click here to toggle dark mode!',
      target: refMap.toggle,
      onClose: () => { refMap.app.current?.click(); }    
    });
    refs.push({
      title: 'Switch to sentence mode',
      content: 'Click here to mark the changes in sentence scale! Don\'t worry, this will be explained more in detail later!',
      target: refMap['sentence-mode'],
      onClose: () => { refMap.app.current?.click(); }    
    });
    refs.push({
      title: 'Restart Tour',
      content: 'You can always restart the tour by clicking here!',
      target: refMap.tour,
      onClose: () => { refMap.app.current?.click();  }
    });
    return refs;
  }
    
  useEffect(() => {
    if(!doTour) return;
    if(currentPage === 0) {
      setTimeout(() => {
        startTour(createFirstStep());
        setCurrentPage(1);
      }, 500);
    }

  }, [startTour, doTour, currentPage, setCurrentPage]);

  return (
    <div className={`welcome-screen ${className}`} data-theme={isDarkMode ? 'dark' : 'light'}>
      <Text className='menu-info-text'><ArrowUpOutlined /> PS: (hover here to resummon me) <ArrowUpOutlined /></Text>
      <span ref={refMap.welcome as React.RefObject<HTMLDivElement>}>
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
                id={'welcome-menu-'+item.key}
                ref={refMap[item.key]}
              >
                {item.label}
              </Button>
            </List.Item>
          )}
        />
      </span>
    </div>
  );
};

export default WelcomeScreen;
