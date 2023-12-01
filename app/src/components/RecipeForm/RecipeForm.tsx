import React, { useState } from 'react';
import { Form, Input, Button, Slider, Row, Col, Typography } from 'antd';
import './RecipeForm.css';

type RecipeFormProps = {
    submitHit: (recipe: string, improvementLevel: number) => void;
};

export const RecipeForm: React.FC<RecipeFormProps> = ({submitHit}) => {
    const [recipe, setRecipe] = useState<string>('');
    const [improvementLevel, setImprovementLevel] = useState<number>(50);

    const handleSubmit = async () => {
        submitHit(recipe, improvementLevel);
    };

    return (
        <Form onFinish={handleSubmit} style={{height: '100%'}}>
            <Form.Item>
                <Row>
                    <Col span={12}>
                        <Button type="primary" htmlType="submit">
                            Get Improved Recipe
                        </Button>
                    </Col>
                    <Col span={12}>
                        <Typography.Text style={{ marginRight: '10px' }}>Improvement Level</Typography.Text>
                        <Slider
                                min={0}
                                max={100}
                                onChange={(value: number) => setImprovementLevel(value)}
                                value={improvementLevel}
                                tooltipVisible
                                style={{ marginTop: '20px' }}
                        />
                    </Col>
                </Row>
            </Form.Item>
            <Form.Item name="recipe" style={{height: '100%'}}>
                <Typography.Text type="secondary">Recipe:</Typography.Text>
                <Input.TextArea style={{height: '100%'}} className='recipe-input' value={recipe} onChange={e => setRecipe(e.target.value)} />
            </Form.Item>
        </Form>
    );
};

export default RecipeForm;
