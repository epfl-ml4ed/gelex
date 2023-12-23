import React, { useState } from 'react';
import { Form, Input, Button, Slider, Row, Col, Typography } from 'antd';
import './RecipeForm.css';
import { NotificationInstance } from 'antd/es/notification/interface';

type RecipeFormProps = {
    submitHit: (recipe: string, improvementLevel: number) => void;
    currentStep: number;
    api: NotificationInstance;
};

export const RecipeForm: React.FC<RecipeFormProps> = ({submitHit, currentStep, api}) => {
    const [recipe, setRecipe] = useState<string>('');
    const [improvementLevel, setImprovementLevel] = useState<number>(0);
    const [recentlyShown, setRecentlyShown] = useState<boolean>(false);
    
    const handleSubmit = async () => {
        submitHit(recipe, improvementLevel);
    };

    const inputsDisabled = currentStep != 0;

    const formatter = (value: number|undefined) => {
        if (value === undefined) {
            return 'Minimal improvement';
        }
        switch (value) {
            case 0:
                return 'Minimal improvement';
            case 1:
                return 'Slight improvement';
            case 2:
                return 'Moderate improvement';
            case 3:
                return 'Significant improvement';
            case 4:
                return 'Major improvement';
        }
    };

    const sliderChange = (value: number) => {
        setImprovementLevel(value);
        if (!recentlyShown && value===4 ) {
            api.warning({
                message: 'Warning',
                description: 'Note this might result in a significant deviation from the original recipe.',
                placement: 'top',
                onClose: () => setRecentlyShown(false),
            });
            setRecentlyShown(true);
        }
    };

    return (
        <Form onFinish={handleSubmit} style={{height: '100%'}}>
            <Form.Item>
                <Row>
                    <Col span={12}>
                        <Button type="primary" htmlType="submit" disabled={inputsDisabled}>
                            Get Improved Recipe
                        </Button>
                    </Col>
                    <Col span={12}>
                        <Typography.Text style={{ marginRight: '10px' }}>Improvement Level</Typography.Text>
                        <Slider
                                min={0}
                                max={4}
                                onChange={(value: number) => sliderChange(value)}
                                value={improvementLevel}
                                tooltip={{formatter}}
                                style={{ marginTop: '20px' }}
                                disabled={inputsDisabled}
                        />
                    </Col>
                </Row>
            </Form.Item>
            <Form.Item name="recipe" style={{height: '100%'}}>
                <Typography.Text type="secondary">Recipe:</Typography.Text>
                <Input.TextArea rows={8} className='recipe-input' value={recipe} onChange={e => setRecipe(e.target.value)} disabled={inputsDisabled}/>
            </Form.Item>
        </Form>
    );
};

export default RecipeForm;
