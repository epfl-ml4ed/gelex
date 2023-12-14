import { Card, Col, Empty, Row, Space } from "antd"
import { Guider, ImprovedRecipeDisplayWordScale, RecipeForm } from "../../components"
import { useState } from "react";
import { BackendInput, ImprovedRecipe, BackendResponse, BackendUserResult } from "../../types";
import { NotificationInstance } from "antd/es/notification/interface";

type MainPageProps = {
    api: NotificationInstance
}


const backendUrl = 'https://gelex-backend-a3bfadfb8f41.herokuapp.com/'

export const MainPage: React.FC<MainPageProps> = ({api}) => {

    const [currentStep, setStep] = useState(0);
    const [originalRecipe, setOriginalRecipe] = useState<string>('');
    const [improvementLevel, setImprovementLevel] = useState<number>(0);
    const [improvedRecipe, setImprovedRecipe] = useState<ImprovedRecipe|undefined>(undefined);
    const [improvedRecipeLoading, setimprovedRecipeLoading] = useState(false);


    const submitHit = (recipe: string, improvementLevel: number) => {
        // Check the length of the recipe
        if (recipe.length < 25) {
            api.error({
                message: 'Error',
                description: 'Please enter a longer recipe.',
                placement: 'top',
            });
            return;
        }
        const rule_counts = [1,3,5,10,30];
        console.log(`Submitting hit with recipe: ${recipe} and improvementLevel: ${improvementLevel}, num_rules: ${rule_counts[improvementLevel]}`)
        setimprovedRecipeLoading(true);
        setStep(1);

        // Read userId from cookie
        const userId = document.cookie.split(';').find((cookie) => cookie.includes('userId'))?.split('=')[1];

        // Hit the backendUrl/example with a post request
        // The backend will return a new recipe
        fetch(`${backendUrl}/example`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_recipe: recipe,
                number_of_rules: rule_counts[improvementLevel],
                user_id: userId,
            } as BackendInput)
        }).then(response => response.json().then((data) => {
            console.log('Data:', data);
            const dataBackEnd = data as BackendResponse;
            console.log('DataBackend:', dataBackEnd)
            setOriginalRecipe(recipe);
            setImprovementLevel(improvementLevel);
            setImprovedRecipe({
                recipeText: dataBackEnd.example_recipe,
                annotations: dataBackEnd.annotations,
            })
            setimprovedRecipeLoading(false);
            setStep(2);
            console.log('Annotations: ', data.annotations);
            console.log('Recipe: ', data.example_recipe);
            api.success({
                message: 'Your new recipe is here!',
                description: 'Can you identify the changes? Click on the words you think are new!',
                placement: 'top',
            });

        })).catch(error => {
            setimprovedRecipeLoading(false);
            console.log(error);
            api.error({
                message: 'Error',
                description: 'Something went wrong. Please try again.',
                placement: 'top',
            });
        }
        );
    };

    const finishReview = (results:BackendUserResult) => {
        // Extend the results with the original recipe and improvement level
        results.originalRecipe = originalRecipe;
        results.improvementLevel = improvementLevel;
        console.log('Submitting results', results);
        // Refresh the page to reset everything
        window.location.reload();
    }

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
                        sendUserResults={finishReview}
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