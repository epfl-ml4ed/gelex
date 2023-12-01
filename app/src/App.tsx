import React, { useState } from 'react';
import { Layout, Row, Col, Card, notification } from 'antd';
import { Header as HeaderTabs, RecipeForm, ImprovedRecipeDisplay } from './components';
const { Header, Content } = Layout;
import './App.css';
import { ImprovedRecipe } from './types';


const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('app');
    const [improvedRecipe, setImprovedRecipe] = useState<ImprovedRecipe|undefined>(undefined);
    const [improvedRecipeLoading, setimprovedRecipeLoading] = useState(false);

    const [api, contextHolder] = notification.useNotification();


    const submitHit = (recipe: string, improvementLevel: number) => {
        console.log(`Submitting hit with recipe: ${recipe} and improvementLevel: ${improvementLevel}`)
        setimprovedRecipeLoading(true);
        setTimeout(() => {
            setImprovedRecipe({
                recipeText: 'Sentence 1. Sentence 2. Sentence 3. Sentence 4.',
                correctSentences: new Set(["Sentence 1.", "Sentence 2."]),
            });
            setimprovedRecipeLoading(false);
            api.success({
                message: 'Your new recipe is here!',
                description: 'Can you identify the changes? Click on the words you think are new!',
                placement: 'top',
            });
        }, 1);
    };

    return (
        <Layout className='layout'>
            {contextHolder}
            <Header style={{backgroundColor: '#dce0e8'}}>
                <HeaderTabs onTabChange={setActiveTab} />
            </Header>
            <Content style={{ padding: '20px' }}>
                {activeTab === 'app' && (
                    <Row gutter={16} style={{height: '100%'}}>
                        <Col span={12} style={{height: '100%'}}>
                            <RecipeForm submitHit={submitHit}/>
                        </Col>
                        <Col span={12}>
                            <Card title="Improved Recipe" loading={improvedRecipeLoading}>
                                {improvedRecipe && (
                                <ImprovedRecipeDisplay 
                                    improvedRecipe={improvedRecipe}
                                />
                                )}
                            </Card>
                        </Col>
                    </Row>
                )}
                {/* Render About Us content here when activeTab is 'about' */}
            </Content>
        </Layout>
    );
};

export default App;
