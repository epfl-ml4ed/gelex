import React, { useEffect, useState } from 'react';
import { Form, Popover, Button, theme, Typography } from 'antd';
import './ImprovedRecipeDisplay.css';
import { ImprovedRecipe } from '../../types';
import { DislikeOutlined, LikeOutlined } from '@ant-design/icons';
import confetti from 'canvas-confetti'; // Import the library

type ImprovedRecipeDisplayProps = {
    improvedRecipe: ImprovedRecipe;
};

export const ImprovedRecipeDisplayWordScale: React.FC<ImprovedRecipeDisplayProps> = ({ improvedRecipe }) => {
    const [selectedWords, setSelectedWords] = useState<Map<number, string>>(new Map());
    const [showPopover, setShowPopover] = useState<number | null>(null);
    const [allWordsSelected, setAllWordsSelected] = useState<boolean>(false);
    // Read dark mode from config
    const { theme: themeToken } = theme.useToken();
    const isDarkMode = themeToken.id === 1;
    const { recipeText, correctWords } = improvedRecipe;

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

    useEffect(() => {
        // Count the current accepted + declined word count
        const acceptedWords = Array.from(selectedWords.values()).filter((status) => status === 'accepted').length;
        const declinedWords = Array.from(selectedWords.values()).filter((status) => status === 'declined').length;
        const totalWords = acceptedWords + declinedWords;
        if (totalWords === correctWords.size && !allWordsSelected) {
            console.log('All words have been accepted or declined');
            setAllWordsSelected(true);
            confetti({
                angle: 60,
                spread: 55,
                particleCount: 150,
                origin: { x: 0 } // start from the left
            });
            confetti({
                angle: 120,
                spread: 55,
                particleCount: 150,
                origin: { x: 1 } // start from the right
            });
        }
    }, [selectedWords]);

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
                    <div className={`like-dislike-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                        <Button className="like-button" onClick={() => handleAccept(index)}>
                            <LikeOutlined />
                        </Button>
                        <Button className="dislike-button" onClick={() => handleDecline(index)}>
                            <DislikeOutlined />
                        </Button>
                    </div>
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

    // Animation classes added to the elements
    const submitButtonClass = allWordsSelected ? "submit-button-enter" : "";
    const congratsClass = allWordsSelected ? "congrats-text-enter" : "";
    return (
        <Form layout="vertical">
            <Form.Item>
                <div style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                    {words}
                </div>
            </Form.Item>
            {allWordsSelected && (
                <Form.Item>
                <Typography.Text strong className={congratsClass}>
                    Congratulations! You found all words!
                </Typography.Text>
                <Button type="primary" className={submitButtonClass}>
                    Submit your results!
                </Button>
            </Form.Item>
            )
            }
        </Form>
    );
};

export default ImprovedRecipeDisplayWordScale;
