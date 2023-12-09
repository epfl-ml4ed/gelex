import React, { useState } from 'react';
import { Layout, Row, Col, Card, notification, Space } from 'antd';
import { Header as HeaderTabs, RecipeForm, ImprovedRecipeDisplayWordScale, Guider } from './components';
const { Header, Content } = Layout;
import './App.css';
import { ImprovedRecipe } from './types';


type AppProps = {
    setDarkMode: (isDarkMode: boolean) => void;
};

const App: React.FC<AppProps> = ({setDarkMode}) => {
    const [activeTab, setActiveTab] = useState<string>('app');
    const [improvedRecipe, setImprovedRecipe] = useState<ImprovedRecipe|undefined>(undefined);
    const [improvedRecipeLoading, setimprovedRecipeLoading] = useState(false);

    const [api, contextHolder] = notification.useNotification();
    const [currentStep, setStep] = useState(0);



    const submitHit = (recipe: string, improvementLevel: number) => {
        console.log(`Submitting hit with recipe: ${recipe} and improvementLevel: ${improvementLevel}`)
        setimprovedRecipeLoading(true);
        setStep(1);
        setTimeout(() => {
            setImprovedRecipe({
                recipeText: 'Word1 Word2 Word3. Word4 Word2 . Word6 Word7 Word8.',
                correctWords: new Set(["Word2", "Word5"]),
            });
            setimprovedRecipeLoading(false);
            setStep(2);
            api.success({
                message: 'Your new recipe is here!',
                description: 'Can you identify the changes? Click on the words you think are new!',
                placement: 'top',
            });
        }, 2000);
    };

    return (
        <Layout className='layout'>
            {contextHolder}
            <Header style={{backgroundColor: '#dce0e8'}}>
                <HeaderTabs onTabChange={setActiveTab} setDarkMode={setDarkMode} />
            </Header>
            <Content style={{ padding: '20px' }}>
                {activeTab === 'app' && (
                    <Space direction="vertical" size="large" style={{ display: 'flex' }}>
                        <Row>
                            <Guider currentStep={currentStep}/>
                        </Row>
                        <Row gutter={32} style={{height: '100%'}}>
                            <Col span={12} style={{height: '100%'}}>
                                <RecipeForm submitHit={submitHit} currentStep={currentStep} api={api}/>
                            </Col>
                            <Col span={12}>
                                <Card title="Improved Recipe" loading={improvedRecipeLoading}>
                                    {improvedRecipe && (
                                    <ImprovedRecipeDisplayWordScale 
                                        improvedRecipe={improvedRecipe}
                                    />
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    </Space>
                )}
                {/* Render About Us content here when activeTab is 'about' */}
            </Content>
        </Layout>
    );
};

export default App;
