import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Form, Popover, Button, Typography } from 'antd';
import './ImprovedRecipeDisplay.css';
import { BackendUserResultDetails, ImprovedRecipe } from '../../types';
import { DislikeOutlined, LikeOutlined } from '@ant-design/icons';
import confetti from 'canvas-confetti'; // Import the library
import { IPageRef, TourContext } from '..';

type ImprovedRecipeDisplayProps = {
    improvedRecipe: ImprovedRecipe;
    sendUserResults: (res: BackendUserResultDetails) => void;
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
    // const annotations = {'Worcestershire': [['worcestershir', 16], ['worcestershir', 72]], 'sift': [['sift', 37]], 'sifted': [['sift', 54]], 'Heat': [['heat', 45]], 'bowl,': [['bowl', 36]], 'separate': [['separ', 35]], 'choice]': [['choic', 23]], 'Spices': [['spice', 20]], 'spices': [['spice', 40], ['spice', 56]], 'Oil': [['oil', 10]], 'oil': [['oil', 47]], 'Stir': [['stir', 62], ['stir', 78]], 'pour': [['pour', 94]], 'Flour': [['flour', 12]], 'flour': [['flour', 42], ['flour', 58]], 'pan': [['pan', 50]], 'Dry': [['dry', 19]], 'dry': [['dry', 39], ['dry', 55]], 'thicken]': [['thicken', 14]], 'thickens.': [['thicken', 65]], 'thickened': [['thicken', 76]], 'mixture': [['mixtur', 59]], 'mixture.': [['mixtur', 77]]}

    // Ref Map
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {};
    refMap['all-word-wrapper'] = useRef<HTMLDivElement>(null);
    refMap['result-wrapper'] = useRef<HTMLDivElement>(null);
    refMap['first-word'] = useRef<HTMLDivElement>(null);
    refMap['second-word'] = useRef<HTMLDivElement>(null);
    refMap['third-word'] = useRef<HTMLDivElement>(null);
    refMap['first-word-pop'] = useRef<HTMLDivElement>(null);
    refMap['second-word-pop'] = useRef<HTMLDivElement>(null);
    refMap['third-word-pop'] = useRef<HTMLDivElement>(null);
    refMap['first-word-pop-like'] = useRef<HTMLDivElement>(null);
    refMap['second-word-pop-like'] = useRef<HTMLDivElement>(null);
    refMap['third-word-pop-like'] = useRef<HTMLDivElement>(null);
    refMap['first-word-pop-dislike'] = useRef<HTMLDivElement>(null);
    refMap['second-word-pop-dislike'] = useRef<HTMLDivElement>(null);
    refMap['third-word-pop-dislike'] = useRef<HTMLDivElement>(null);

    const { startTour, doTour, currentPage, setCurrentPage } = useContext(TourContext);

    const createTour = () => {
        const refs:IPageRef[] = []
        refs.push({
            title: 'Identifying changes',
            content: 'To identify the changes we click on words(or sentences) that we think have been changed.',
            target: refMap['first-word'],
            onNext: () => {
                refMap['first-word']?.current?.click();
            },
            preventClose: true,
        });
        refs.push({
            title: 'Do you like it?',
            content: 'We\'ll give you some explanation on why we implemented the change and ask you if you like it.',
            target: refMap['first-word-pop'],
            onNext: () => {
                handleAccept(0)
            },
            preventClose: true,
        });
        refs.push({
            title: 'Mark ALL the changes!',
            content: 'You have to find all the changes and mark them all!',
            target: refMap['all-word-wrapper'],
            onNext: () => {
                handleDecline(2);
                handleAccept(9);
                setTimeout(() => {}, 100);
            },
            preventClose: true,
        });
        refs.push({
            title: 'Wrapping up!',
            content: 'After you find all the changes you\'ll be able to submit your results!',
            target: refMap['result-wrapper'],
            onClose: () => {
                finishReview();
            }
        });
        return refs;
    }

    useEffect(() => {
        if(!doTour) return;
        if(currentPage === 5) return;
        if(currentPage === 4) {
            setCurrentPage(5);
            startTour(createTour());
        }
    }, [startTour, doTour, currentPage, setCurrentPage, createTour]);

    const finishReview = () => {
        const res: BackendUserResultDetails = {
            improvedRecipe: recipeText,
            selectedIndexes: selectedWords,
            timestamp: new Date().toISOString(),
            mode: 'word',
        };
        sendUserResults(res);
    };

    const toggleWordSelection = (word: string, index: number) => {
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
        //console.log('line-split', line.split(/\s+/));
        const mappingTemp = line.split(/\s+/).filter((word)=>word.trim().length>0);
        //console.log('mappingTemp: ', mappingTemp)
        const wordElements = mappingTemp.map((word) => {
            const currentWordIndex = wordIndex; // Store the current word index
            wordIndex++; // Increment the wordIndex for the next word

            return (
                <Popover
                    content={
                        <div>
                            <p>Explanation for {word}</p>
                            <div className="like-dislike-container">
                                <Button className="like-button" onClick={() => handleAccept(currentWordIndex)} ref={
                                    (doTour && currentPage === 3 && currentWordIndex === 0 ? refMap['first-word-pop-like'] :
                                    (doTour && currentPage === 3 && currentWordIndex === 2 ? refMap['second-word-pop-like'] :
                                    (doTour && currentPage === 3 && currentWordIndex === 9 ? refMap['third-word-pop-like'] : undefined))
                                )
                                }>
                                    <LikeOutlined />
                                </Button>
                                <Button className="dislike-button" onClick={() => handleDecline(currentWordIndex)}
                                ref={
                                    (doTour && currentPage === 3 && currentWordIndex === 0 ? refMap['first-word-pop-dislike'] :
                                    (doTour && currentPage === 3 && currentWordIndex === 2 ? refMap['second-word-pop-dislike'] :
                                    (doTour && currentPage === 3 && currentWordIndex === 9 ? refMap['third-word-pop-dislike'] : undefined))
                                )
                                }>
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
                    ref={
                        (doTour && currentPage === 3 && currentWordIndex === 0 ? refMap['first-word-pop'] :
                        (doTour && currentPage === 3 && currentWordIndex === 2 ? refMap['second-word-pop'] :
                        (doTour && currentPage === 3 && currentWordIndex === 9 ? refMap['third-word-pop'] : undefined)))
                    }
                >
                    <span
                        onClick={() => toggleWordSelection(word, currentWordIndex)}
                        style={{ ...getWordStyle(selectedWords.get(currentWordIndex)), marginRight: '5px', cursor: 'pointer' }}
                        ref={
                            doTour && currentPage === 3 && currentWordIndex === 0 ? refMap['first-word'] :
                            (doTour && currentPage === 3 && currentWordIndex === 2 ? refMap['second-word'] :
                            (doTour && currentPage === 3 && currentWordIndex === 9 ? refMap['third-word'] : undefined))
                        }
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
            <span ref={refMap['all-word-wrapper']}>
                <Form.Item>
                    <div style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                        {words}
                    </div>
                </Form.Item>
            </span>
            {allWordsSelected && (
                <Form.Item>
                <Typography.Text strong className={congratsClass}>
                    Congratulations! You found all words!
                </Typography.Text>
                <Button type="primary" className={submitButtonClass} onClick={finishReview} ref={refMap['result-wrapper']}>
                    Submit your results!
                </Button>
            </Form.Item>
            )
            }
        </Form>
    );
};

export default ImprovedRecipeDisplayWordScale;
