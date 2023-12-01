import React, { useState } from 'react';
import { Form, Popover, Button } from 'antd';
import './ImprovedRecipeDisplay.css';

type ImprovedRecipeDisplayProps = {
    recipeText: string;
    correctWords: Set<string>; // Set of correct words
};

export const ImprovedRecipeDisplay: React.FC<ImprovedRecipeDisplayProps> = ({ recipeText, correctWords }) => {
    const [selectedWords, setSelectedWords] = useState<Map<number, string>>(new Map());
    const [showPopover, setShowPopover] = useState<number | null>(null);

    const toggleWordSelection = (word: string, index: number) => {
        if (correctWords.has(word)) {
            setSelectedWords(new Map(selectedWords.set(index, 'correct')));
            setShowPopover(index);
        } else {
            setSelectedWords(new Map(selectedWords.set(index, 'incorrect')));
            // Set timeout to clear the incorrect status after animation duration
            setTimeout(() => {
                setSelectedWords((prevSelectedWords) => {
                    const newSelectedWords = new Map(prevSelectedWords);
                    newSelectedWords.delete(index); // Remove the incorrect status
                    return newSelectedWords;
                });
            }, 1000); // Assuming the animation duration is 1 second
        }
    };

    const handleAccept = (index: number) => {
        setSelectedWords(new Map(selectedWords.set(index, 'accepted')));
        setShowPopover(null);
    };

    const handleDecline = (index: number) => {
        setSelectedWords(new Map(selectedWords.set(index, 'declined')));
        setShowPopover(null);
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
    

    const words = recipeText.split(/\s+/).map((word, index) => (
        <Popover
            content={
                <div>
                    <p>Explanation for {word}</p>
                    <Button onClick={() => handleAccept(index)}>Accept</Button>
                    <Button onClick={() => handleDecline(index)}>Decline</Button>
                </div>
            }
            title="Word Selection"
            trigger="click"
            visible={showPopover === index}
            onVisibleChange={(visible) => !visible && setShowPopover(null)}
            key={index}
        >
            <span
                onClick={() => toggleWordSelection(word, index)}
                style={{ ...getWordStyle(selectedWords.get(index)), marginRight: '5px', cursor: 'pointer' }}
            >
                {word}
            </span>
        </Popover>
    ));

    return (
        <Form layout="vertical">
            <Form.Item label="Improved Recipe">
                <div style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                    {words}
                </div>
            </Form.Item>
        </Form>
    );
};

export default ImprovedRecipeDisplay;
