import { Card, Col, Empty, Popover, Row, Space } from "antd"
import { Guider, IPageRef, ImprovedRecipeDisplaySentenceScale, ImprovedRecipeDisplayWordScale, RecipeForm, TourContext } from "../../components"
import { useContext, useRef, useState } from "react";
import { BackendInput, ImprovedRecipe, BackendResponse, BackendUserResult, BackendUserResultDetails } from "../../types";
import { NotificationInstance } from "antd/es/notification/interface";
import { BulbOutlined, QuestionOutlined } from "@ant-design/icons";

type MainPageProps = {
    api: NotificationInstance
    setActivePage: (page: string) => void;
    currentMode: string;
}

const backendUrl = 'https://gelex-backend-a3bfadfb8f41.herokuapp.com'

export const MainPage: React.FC<MainPageProps> = ({api, setActivePage, currentMode}) => {
    const { doTour, setCurrentPage, startTour, setDoTour } = useContext(TourContext);

    const [currentStep, setStep] = useState(0);
    const [originalRecipe, setOriginalRecipe] = useState<string>('');
    const [improvementLevel, setImprovementLevel] = useState<number>(0);
    // Does the cookie savedImprovedRecipe exist? (for debugging)
    // const savedImprovedRecipe = document.cookie.split(';').find((cookie) => cookie.includes('savedImprovedRecipe'))?.split('=')[1];
    const [improvedRecipe, setImprovedRecipe] = useState<ImprovedRecipe|undefined>();
    const [improvedRecipeLoading, setimprovedRecipeLoading] = useState(false);
    // Ref Map
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {};
    refMap['improved-recipe-wrapper'] = useRef<HTMLDivElement>(null);
    refMap['reveal-next-change'] = useRef<HTMLDivElement>(null);
    refMap['reveal-all-changes'] = useRef<HTMLDivElement>(null);
    
    const [refState, _] = useState<IPageRef[]>([{
            title: 'Your improved recipe will be here!',
            content: `You will be asked to find out the changes either in word-scale or sentence-scale(Remember you can always the scale from the menu!)`,
            target: refMap['improved-recipe-wrapper'],
            onClose: () => {
                setCurrentPage(4);
            }
        },
        {
            title: 'Reveal the changes!',
            content: 'Click here to reveal one of the changes!',
            target: refMap['reveal-next-change'],
            onClose: () => {
                setCurrentPage(4);
            }
        },
        {
            title: 'Reavel the changes!',
            content: 'Click here to reveal all of the changes!',
            target: refMap['reveal-all-changes'],
            onClose: () => {
                setCurrentPage(4);
            }
        }
    ]);
    

    const [revealExtraWord, setRevealExtraWord] = useState<() => void>(() => () => {});
    const [revealAllWords, setRevealAllWords] = useState<() => void>(() => () => {});

    const submitHit = (recipe: string, improvementLevel: number, fromTour?: boolean) => {
        console.log('Submitting recipe: ', recipe, fromTour)
        if(doTour && fromTour){
            setImprovedRecipe({
                recipeText: 'This is an example improved recipe. Click on the words you think are new!',
                annotations: {
                    'This': [['th', 0]],
                    'an': [['an', 2]],
                    'words': [['word', 9]],
                },
            })
            setCurrentPage(3)
            setTimeout(()=>startTour(refState),1);
            console.log('starting Tour', refState)
            setStep(2);
            return;
        }
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
        // console.log(`Submitting hit with recipe: ${recipe} and improvementLevel: ${improvementLevel}, num_rules: ${rule_counts[improvementLevel]}`)
        setimprovedRecipeLoading(true);
        setStep(1);

        // Read userId from cookie
        const userId = document.cookie.split(';').find((cookie) => cookie.includes('userId'))?.split('=')[1];

        // Hit the backendUrl/example with a post request
        // The backend will return a new recipe
        fetch(`${backendUrl}/example`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_recipe: recipe,
                number_of_rules: rule_counts[improvementLevel],
                user_id: userId,
            } as BackendInput)
        }).then(response => response.json().then((data) => {
            const dataBackEnd = data as BackendResponse;
            // console.log('DataBackend:', dataBackEnd)
            setOriginalRecipe(recipe);
            setImprovementLevel(improvementLevel);
            setImprovedRecipe({
                recipeText: dataBackEnd.example_recipe,
                annotations: dataBackEnd.annotations,
            });
            setimprovedRecipeLoading(false);
            setStep(2);
            // console.log('Annotations: ', data.annotations);
            // console.log('Recipe: ', data.example_recipe);
            api.success({
                message: 'Your new recipe is here!',
                description: 'Can you identify the changes? Click on the words you think are new!',
                placement: 'top',
            });

        })).catch(error => {
            setimprovedRecipeLoading(false);
            setStep(0);
            console.log(error);
            api.error({
                message: 'Error',
                description: 'Something went wrong. Please try again.',
                placement: 'top',
                duration: 0,
            });
        }
        );
    };

    const finishReview = (results:BackendUserResultDetails) => {
        if(doTour){
            setActivePage('result');
            setDoTour(false);
            // Set cookieTour to true
            document.cookie = "tour=true;max-age=31536000";
            return;
        }
        // Extend the results with the original recipe and improvement level
        results.originalRecipe = originalRecipe;
        results.improvementLevel = improvementLevel;
        const userId = document.cookie.split(';').find((cookie) => cookie.includes('userId'))?.split('=')[1];
        if (!userId) { 
            api.error({
                message: 'Error',
                description: 'Something went wrong. Please try again.',
                placement: 'top',
            });
            return;
        }
        const resultsForBackend: BackendUserResult = {
            user: userId,
            event: 'finishReview',
            details: results,
        }
        // console.log('Submitting results', resultsForBackend);
        // Hit endpoint with results(/trace/)
        fetch(`${backendUrl}/trace`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resultsForBackend)
        }).then(response => response.json().then((data) => {
            console.log('Trace Data:', data);
            // Go to results page.
            setActivePage('result');
        })).catch(error => {
            console.log(error);
            api.error({
                duration: 0,
                message: 'Error',
                description: 'Something went wrong. Please try again.',
                placement: 'top',
            });
        }
        );
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
                <Card 
                title="Improved Recipe" 
                loading={improvedRecipeLoading}
                ref={refMap['improved-recipe-wrapper']}
                actions={[
                    <Popover
                        content={"Reveal one extra " + (currentMode === 'sentence' ? 'sentence' : 'word') + "!"}
                    >
                        <QuestionOutlined onClick={revealExtraWord} ref={refMap['reveal-next-change']}/>
                    </Popover>,
                    <Popover
                        content={"Reveal all " + (currentMode === 'sentence' ? 'sentences' : 'words') + "!"}
                    >
                        <BulbOutlined onClick={revealAllWords} ref={refMap['reveal-all-changes']}/>
                    </Popover>,
                ]}>
                    {improvedRecipe && currentMode === 'sentence' && (
                    <ImprovedRecipeDisplaySentenceScale 
                        improvedRecipe={improvedRecipe}
                        sendUserResults={finishReview}
                        setRevealExtraWord={setRevealExtraWord}
                        setRevealAllWords={setRevealAllWords}
                    />)}
                    {improvedRecipe && currentMode === 'word' && (
                    <ImprovedRecipeDisplayWordScale 
                        improvedRecipe={improvedRecipe}
                        sendUserResults={finishReview}
                        setRevealExtraWord={setRevealExtraWord}
                        setRevealAllWords={setRevealAllWords}
                    />)}
                    {!improvedRecipe && (<Empty
                    description='No recipe yet!'
                    />)}                
                </Card>
            </Col>
        </Row>
    </Space>
)}