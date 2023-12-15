import React, { useEffect, useMemo, useState } from 'react';
import { Form, Popover, Button, Typography } from 'antd';
import './ImprovedRecipeDisplay.css';
import { BackendUserResult, ImprovedRecipe } from '../../types';
import { DislikeOutlined, LikeOutlined } from '@ant-design/icons';
import confetti from 'canvas-confetti'; // Import the library

type ImprovedRecipeDisplayProps = {
    improvedRecipe: ImprovedRecipe;
    sendUserResults: (res: BackendUserResult) => void;
    setRevealExtraWord: (fn: () => void) => void;
    setRevealAllWords: (fn: () => void) => void;
};

export const ImprovedRecipeDisplayWordScale: React.FC<ImprovedRecipeDisplayProps> = ({ improvedRecipe, 
    sendUserResults, 
    setRevealExtraWord,
    setRevealAllWords
 }) => {
    const [selectedWords, setSelectedWords] = useState<Map<number, string>>(new Map());
    const [showPopover, setShowPopover] = useState<number | null>(null);
    const [allWordsSelected, setAllWordsSelected] = useState<boolean>(false);
    // Read dark mode from config
    const { recipeText, annotations } = improvedRecipe;
    

    const finishReview = () => {
        const res: BackendUserResult = {
            userId: document.cookie.split(';').find((cookie) => cookie.includes('userId'))?.split('=')[1],
            improvedRecipe: recipeText,
            selectedWords: selectedWords,
            timestamp: new Date().toISOString(),
        };
        sendUserResults(res);
    };

    const toggleWordSelection = (word: string, index: number) => {
        console.log('Clicked on word: ', word, ' with index: ', index)
        // Check if word is in annotations
        if (annotations[word]?.some(([_, wordIndex]) => wordIndex === index)) {
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

    const { indices, annotationSize } = useMemo(() => {
        const indices = new Set<number>();
        Object.values(annotations).forEach(tuples => {
            tuples.forEach(([, index]) => indices.add(index));
        });
        return { indices, annotationSize: indices.size}
    }, [annotations]);

    useEffect(() => {
        setRevealExtraWord(() => () => {
            // Find index that is in annotations but not in selectedWords
            const index = Array.from(indices).find(index => !selectedWords.has(index));
            if (index !== undefined) {
                setSelectedWords(new Map(selectedWords.set(index, 'correct')));
                setShowPopover(index);
            }
        });
        setRevealAllWords(() => () => {
            // Find ALL indices that are in annotations but not in selectedWords
            const newSelectedWords = new Map(selectedWords);
            indices.forEach(index => {
                if (!selectedWords.has(index)) {
                    newSelectedWords.set(index, 'correct');
                }
            });
            setSelectedWords(newSelectedWords);
        });
    }, [selectedWords, indices]);

    useEffect(() => {
        // Count the current accepted + declined word count
        const acceptedWords = Array.from(selectedWords.values()).filter((status) => status === 'accepted').length;
        const declinedWords = Array.from(selectedWords.values()).filter((status) => status === 'declined').length;
        const totalWords = acceptedWords + declinedWords;
        if (totalWords === annotationSize && !allWordsSelected) {
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
    

    let wordIndex = 0; // Initialize a counter to keep track of the word index

    const words = recipeText.split('\n').flatMap((line, lineIndex) => {
        if (line.trim().length === 0) {
            return [<br key={`br-${lineIndex}`} />];
        }

        const wordElements = line.split(/\s+/).map((word) => {
            const currentWordIndex = wordIndex; // Store the current word index
            wordIndex++; // Increment the wordIndex for the next word

            return (
                <Popover
                    content={
                        <div>
                            <p>Explanation for {word}</p>
                            <div className="like-dislike-container">
                                <Button className="like-button" onClick={() => handleAccept(currentWordIndex)}>
                                    <LikeOutlined />
                                </Button>
                                <Button className="dislike-button" onClick={() => handleDecline(currentWordIndex)}>
                                    <DislikeOutlined />
                                </Button>
                            </div>
                        </div>
                    }
                    title="Word Selection"
                    trigger="click"
                    visible={showPopover === currentWordIndex}
                    onVisibleChange={(visible) => !visible && setShowPopover(null)}
                    key={currentWordIndex}
                >
                    <span
                        onClick={() => toggleWordSelection(word, currentWordIndex)}
                        style={{ ...getWordStyle(selectedWords.get(currentWordIndex)), marginRight: '5px', cursor: 'pointer' }}
                    >
                        {word}{' '}
                    </span>
                </Popover>
            );
        });

        // Add a line break after each line
        return [...wordElements, <br key={`br-${lineIndex}`} />];
    });

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
                <Button type="primary" className={submitButtonClass} onClick={finishReview}>
                    Submit your results!
                </Button>
            </Form.Item>
            )
            }
        </Form>
    );
};

export default ImprovedRecipeDisplayWordScale;
