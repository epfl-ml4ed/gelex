import React, { useEffect } from 'react';
import { SmileOutlined } from '@ant-design/icons';
import { Button, Result } from 'antd';

type ResultPageProps = {
    setActivePage: (page: string) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({setActivePage}) => {

    const [redirectTimer, setRedirectTimer] = React.useState<number>(5);

    const goToHomepage = () => {
        setActivePage('app');
    }

    // Reduce redirect timer every second
    useEffect(() => {
        const timer = setInterval(() => {
            // Check redirect timer
            const newRedicrectTimer = redirectTimer - 1;
            if (newRedicrectTimer <= 0) {
                goToHomepage();
            } else {
                setRedirectTimer(newRedicrectTimer);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [redirectTimer]);

    return(<Result
        icon={<SmileOutlined />}
        title={"Great, you're all done! Thank you. You'll be redirected to the homepage in " + redirectTimer + " seconds."}
        extra={<Button type="primary" onClick={goToHomepage}>Go now!</Button>}
    />
)};

export default ResultPage;
