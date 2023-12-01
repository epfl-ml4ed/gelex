import React, { useEffect, useMemo, useState } from 'react';
import { Form, Popover, Button } from 'antd';
import './ImprovedRecipeDisplay.css'
import { ImprovedRecipe } from '../../types';

type ImprovedRecipeDisplayProps = {
    improvedRecipe: ImprovedRecipe;
};

export const ImprovedRecipeDisplay: React.FC<ImprovedRecipeDisplayProps> = ({ improvedRecipe }) => {
    const [selectedSentence, setSelectedSentence] = useState<number | null>(null);
    const [sentenceStatus, setSentenceStatus] = useState<Map<number, string>>(new Map());

    const { recipeText, correctSentences } = improvedRecipe || {};
    // Strip start and end whitespace from sentence and check if it is in correctSentences
    const isSentenceCorrect = (sentence: string) => correctSentences.has(sentence.trim());

    const sentences = recipeText.match(/[^.!?]+[.!?]+/g) || [];

    const handleClick = (sentence: string, index: number) => {
        if (isSentenceCorrect(sentence)) {
            setSentenceStatus(new Map(sentenceStatus.set(index, 'correct')));
            setSelectedSentence(selectedSentence === index ? null : index);
        }
        else{
            // Incorrect sentence logic
            const updatedStatus = new Map(sentenceStatus).set(index, 'incorrect');
            setSentenceStatus(updatedStatus);

            // Set timeout to clear the incorrect status after animation duration
            setTimeout(() => {
                setSentenceStatus((prevSelectedSentences) => {
                    const newSelectedSentences = new Map(prevSelectedSentences);
                    newSelectedSentences.delete(index); // Remove the incorrect status
                    return new Map(newSelectedSentences); // Create a new Map instance
                });
            }, 1000); // Assuming the animation duration is 1 second
        }
    };

    const handleAccept = (index: number) => {
        setSentenceStatus(new Map(sentenceStatus.set(index, 'accepted')));
        setSelectedSentence(null);
    };

    const handleDecline = (index: number) => {
        setSentenceStatus(new Map(sentenceStatus.set(index, 'declined')));
        setSelectedSentence(null);
    };

    const getWordStyle = (status: string | undefined) => {
        switch (status) {
            case 'correct':
                return { backgroundColor: '#f0f5ff', border: '1px solid #1890ff', borderRadius: '4px', padding: '2px' };
            case 'incorrect':
                return { backgroundColor: '#ffa39e', animation: 'fadeBack 1s', borderRadius: '4px', padding: '2px' }; // Light red
            case 'accepted':
                return { backgroundColor: '#b7eb8f', border: '1px solid #52c41a', borderRadius: '4px', padding: '2px' }; // Light green
            case 'declined':
                return { backgroundColor: '#ffd591', border: '1px solid #faad14', borderRadius: '4px', padding: '2px' }; // Light orange
            default:
                return {};
        }
    };

    // useMemo to memoize sentenceElements
    const sentenceElements = useMemo(() => {
        return sentences.map((sentence, index) => {
            return (
            <Popover
                content={
                    <div>
                        <p>Explanation for this sentence</p>
                        <Button onClick={() => handleAccept(index)}>Accept</Button>
                        <Button onClick={() => handleDecline(index)}>Decline</Button>
                    </div>
                }
                title="Sentence Selection"
                trigger="click"
                visible={selectedSentence === index}
                onVisibleChange={(visible) => !visible && setSelectedSentence(null)}
                key={index}
            >
                <span
                    onClick={() => handleClick(sentence, index)}
                    style={{
                        ...getWordStyle(sentenceStatus.get(index)),
                        marginRight: '5px',
                        cursor: 'pointer',
                    }}
                >
                    {sentence}{' '}
                </span>
            </Popover>
        )
    });
    }, [sentences, selectedSentence, sentenceStatus]); // Dependencies

    return (
        <Form layout="vertical">
            <Form.Item label="Improved Recipe">
                <div style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                    {sentenceElements}
                </div>
            </Form.Item>
        </Form>
    );
};

export default ImprovedRecipeDisplay;
