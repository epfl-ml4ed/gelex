import { Card, Col, Empty, Row, Space } from "antd"
import { Guider, ImprovedRecipeDisplayWordScale, RecipeForm } from "../../components"
import { useState } from "react";
import { ImprovedRecipe } from "../../types";
import { NotificationInstance } from "antd/es/notification/interface";

type MainPageProps = {
    api: NotificationInstance
}


export const MainPage: React.FC<MainPageProps> = ({api}) => {

    const [currentStep, setStep] = useState(0);
    const [improvedRecipe, setImprovedRecipe] = useState<ImprovedRecipe|undefined>(undefined);
    const [improvedRecipeLoading, setimprovedRecipeLoading] = useState(false);


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


    return(
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
                    {!improvedRecipe && (<Empty
                    description='No recipe yet!'
                    />)}                
                </Card>
            </Col>
        </Row>
    </Space>
)}