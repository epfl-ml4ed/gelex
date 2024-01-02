import React, { useContext, useEffect, useRef, useState } from 'react';
import { Form, Input, Button, Slider, Row, Col, Typography } from 'antd';
import './RecipeForm.css';
import { NotificationInstance } from 'antd/es/notification/interface';
import { IPageRef, TourContext } from '..';

type RecipeFormProps = {
    submitHit: (recipe: string, improvementLevel: number, fromTour?: boolean) => void;
    currentStep: number;
    api: NotificationInstance;
};

export const RecipeForm: React.FC<RecipeFormProps> = ({submitHit, currentStep, api}) => {
    const [recipe, setRecipe] = useState<string>('');
    const [improvementLevel, setImprovementLevel] = useState<number>(0);
    const [recentlyShown, setRecentlyShown] = useState<boolean>(false);
    
    const handleSubmit = (fromTour?: boolean) => {
        console.log('Submitting recipe: ', recipe)
        submitHit(recipe, improvementLevel, fromTour);
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

    // Ref Map
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {};
    refMap['recipe-form'] = useRef<HTMLDivElement>(null);
    refMap['improvement-level'] = useRef<HTMLDivElement>(null);
    refMap['submit-recipe'] = useRef<HTMLDivElement>(null);
    
    const { startTour, doTour, currentPage, setCurrentPage, setTourOpen } = useContext(TourContext);

    const createTour = () => {
        const refs:IPageRef[] = []
        refs.push({
            title: 'Your recipe!',
            content: `writing your recipe here! Any recipe is fine, but make sure it's at least 25 characters long!`,
            target: refMap['recipe-form'],
            onClose: () => { handleSubmit(true); setTourOpen(false); }
        });
        refs.push({
            title: 'Choose your improvement level!',
            content: 'After you have finished writing your recipe, choose the improvement level you want to see!',
            target: refMap['improvement-level'],
            onClose: () => { handleSubmit(true); setTourOpen(false); }
        });
        refs.push({
            title: 'Submit!',
            content: 'Send your recipe to the AI chef by clicking here!',
            target: refMap['submit-recipe'],
            onNext: () => {
                handleSubmit(true);
                setTourOpen(false);
            },
            onClose: () => { handleSubmit(true); setTourOpen(false); }
        });
        return refs;
    }

    useEffect(() => {
        if(!doTour) return;
        if(currentPage === 2) return;
        if(currentPage === 1) {
            setCurrentPage(2);
            startTour(createTour());
        }
    }, [startTour, doTour, currentPage, setCurrentPage, createTour]);
      
    return (
        <Form style={{height: '100%'}}>
            <Form.Item>
                <Row>
                    <Col span={12}>
                        <Button type="primary" htmlType="submit" disabled={inputsDisabled} ref={refMap['submit-recipe']} onClick={() => handleSubmit()}>
                            Get Improved Recipe
                        </Button>
                    </Col>
                    <Col span={12}>
                        <Typography.Text style={{ marginRight: '10px' }}>Improvement Level</Typography.Text>
                        <span ref={refMap['improvement-level']}>
                            <Slider
                                    min={0}
                                    max={4}
                                    onChange={(value: number) => sliderChange(value)}
                                    value={improvementLevel}
                                    tooltip={{formatter}}
                                    style={{ marginTop: '20px' }}
                                    disabled={inputsDisabled}
                            />
                        </span>
                    </Col>
                </Row>
            </Form.Item>
            <span ref={refMap['recipe-form']}>
                <Form.Item name="recipe" style={{height: '100%'}}>
                    <Typography.Text type="secondary">Recipe:</Typography.Text>
                    <Input.TextArea rows={8} className='recipe-input' value={recipe} onChange={e => setRecipe(e.target.value)} disabled={inputsDisabled || doTour} />
                </Form.Item>
            </span>
        </Form>
    );
};

export default RecipeForm;
