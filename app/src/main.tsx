import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ConfigProvider, theme } from 'antd';
import {catppuccinColors} from '../catppuccin_scheme';
import { TourProvider } from './components/index.ts';
import { BackendResponse } from './types/BackendTypes';

const backendUrl = 'wss://gelex-backend-a3bfadfb8f41.herokuapp.com/ws/example'; 
// const backendUrl = 'ws://localhost:8000/ws/example';

const Main = () => {
  const { defaultAlgorithm, darkAlgorithm } = theme;
  const cookie = document.cookie.split(';').find((cookie) => cookie.includes('darkMode'));
  const cookieDark = cookie ? cookie.split('=')[1] === 'true' : false;
  const [isDarkMode, setIsDarkMode] = useState(cookieDark);
  const childOnDataReceive = useRef<(data: BackendResponse) => void>(() => {});
  const childOnErrorReceive = useRef<(error: Event) => void>(() => {});
  // Set the cookie
  document.cookie = `darkMode=${isDarkMode}`;

  const themeColors = isDarkMode ? catppuccinColors.Mocha : catppuccinColors.Latte;

  // Does the cookie userId exist?
  // If not, generate random userId and set cookie
  if (!document.cookie.split(';').find((cookie) => cookie.includes('userId'))) {
    const userId = Math.random().toString(36).substring(2, 15);
    document.cookie = `userId=${userId}`;
  }

  const [ws, setWs] = useState<WebSocket | null>(null);

  const setChildOnDataReceive = (fn: (data: BackendResponse) => void) => {
      childOnDataReceive.current = fn;
  };

  const setChildOnErrorReceive = (fn: (error: Event) => void) => {
      childOnErrorReceive.current = fn;
  }
  
  useEffect(() => {
      let shouldReconnect = true;
      const connectWebSocket = () => {
          // console.log('Reconnecting WebSocket...')
          const webSocket = new WebSocket(backendUrl);

          webSocket.onopen = () => {
              // console.log("WebSocket connection established");
          };

          webSocket.onmessage = (event) => {
            // Check if the incoming message is just a ping message, if so, ignore it
            if (event.data === 'ping') {
              console.log('Received ping message')
              return; // This is used to keep the connection alive
            }
            // Handle incoming messages
            const dataBackEnd = JSON.parse(event.data) as BackendResponse;
            if (childOnDataReceive.current) {
                childOnDataReceive.current(dataBackEnd);
            }     
          };

          webSocket.onerror = (error) => {
            console.log("WebSocket error:", error);
            if (childOnErrorReceive.current) {
                childOnErrorReceive.current(error);
            }
          };

          webSocket.onclose = (event) => {
              console.log("WebSocket connection closed", event.code, event.reason, "Reconnecting...");
              if (shouldReconnect) {
                  // Reconnect after a delay
                  setTimeout(() => {
                      connectWebSocket();
                  }, 1000); // Adjust the delay as needed
              }
          };
          setWs(webSocket);
      };

      connectWebSocket();

      // Cleanup function: runs when component unmounts
      return () => {
          shouldReconnect = false;
          if (ws) {
              ws.close();
          }
      };
  }, []); // Empty dependency array to run only on component mount

  return (
    <React.StrictMode>
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
          token: {
            colorText: themeColors.text,
            colorTextSecondary: themeColors.subtext0,
            colorTextTertiary: themeColors.subtext1,
            colorTextQuaternary: themeColors.overlay0,
            colorBorder: themeColors.border,
            colorBorderSecondary: themeColors.overlay1,
            colorFill: themeColors.fill,
            colorFillSecondary: themeColors.overlay2,
            colorFillTertiary: themeColors.surface0,
            colorFillQuaternary: themeColors.surface1,
            colorBgLayout: themeColors.mantle,
            colorBgContainer: themeColors.crust,
            colorBgElevated: themeColors.base,
            colorBgSpotlight: themeColors.peach, // Example, choose as per your preference
            colorBgBlur: 'rgba(255, 255, 255, 0.5)', // Assuming a light blur effect
            colorPrimary: themeColors.red,
            colorPrimaryBg: themeColors.pink, // Example, choose as per your preference
            colorPrimaryBgHover: themeColors.mauve, // Example, choose as per your preference
            colorPrimaryBorder: themeColors.blue, // Example, choose as per your preference
            colorPrimaryBorderHover: themeColors.teal, // Example, choose as per your preference
            colorPrimaryHover: themeColors.green, // Example, choose as per your preference
            colorPrimaryActive: themeColors.maroon, // Example, choose as per your preference
            colorPrimaryTextHover: themeColors.yellow, // Example, choose as per your preference
            colorPrimaryText: themeColors.peach, // Example, choose as per your preference
            colorPrimaryTextActive: themeColors.flamingo, // Example, choose as per your preference
            // ... map other Catppuccin colors to corresponding Ant Design theme tokens
          }
        }}
      >
      <TourProvider>
        <App 
        setDarkMode={setIsDarkMode} 
        setOnChildDataReceive={setChildOnDataReceive}
        setOnChildErrorReceive={setChildOnErrorReceive}
        ws={ws}
        />
      </TourProvider>
      </ConfigProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Main />
);
