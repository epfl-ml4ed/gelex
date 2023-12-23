import React, { useEffect, useMemo, useState } from 'react';
import { Form, Popover, Button, Typography, theme } from 'antd';
import './ImprovedRecipeDisplay.css';
import { BackendUserResultDetails, ImprovedRecipe } from '../../types';
import { DislikeOutlined, LikeOutlined } from '@ant-design/icons';
import confetti from 'canvas-confetti'; // Import the library

type ImprovedRecipeDisplayProps = {
    improvedRecipe: ImprovedRecipe;
    sendUserResults: (res: BackendUserResultDetails) => void;
    setRevealExtraWord: (fn: () => void) => void;
    setRevealAllWords: (fn: () => void) => void;
};

interface SentenceBoundary {
    start: number;
    end: number;
    sentence: string;
    sentenceIndex: number;
}
interface ClickableSentenceProps {
    sentence: string;
    index: number;
    onAccept: (index: number) => void;
    onDecline: (index: number) => void;
    toggleSelection: (index: number) => void;
    showPopover: boolean;
    setShowPopover: (index: number | null) => void;
    getSentenceStyle?: (index: number) => React.CSSProperties;
    wordsIncluded: {word: string, wordIndex: number}[];
    sentenceStyle?: React.CSSProperties;
}

type BreakElementProps = {}
type ClickableSentenceTempProps = {
    sentence: string;
    index: number;
    onAccept: (index: number) => void;
    onDecline: (index: number) => void;
    toggleSelection: (index: number) => void;
    wordsIncluded: {word: string, wordIndex: number}[];
}


const ClickableSentence: React.FC<ClickableSentenceProps> = React.memo(({
    sentence,
    index,
    onAccept,
    onDecline,
    toggleSelection,
    showPopover,
    setShowPopover,
    sentenceStyle,
}) => {
    // console.log('Rendering sentence', sentence)
    return (
        <Popover
            content={
                <div>
                    <p>Explanation for {sentence}</p>
                    <div className="like-dislike-container">
                        <Button className="like-button" onClick={() => onAccept(index)}>
                            <LikeOutlined />
                        </Button>
                        <Button className="dislike-button" onClick={() => onDecline(index)}>
                            <DislikeOutlined />
                        </Button>
                    </div>
                </div>
            }
            title="Sentence Selection"
            trigger="click"
            visible={showPopover}
            onVisibleChange={(visible) => !visible && setShowPopover(null)}
        >
            <span
                style={{ ...sentenceStyle, marginRight: '5px', cursor: 'pointer' }}
                onClick={() => toggleSelection(index)}
            >
                {sentence}{' '}
            </span>
        </Popover>
    );
});

export const ImprovedRecipeDisplaySentenceScale: React.FC<ImprovedRecipeDisplayProps> = ({ improvedRecipe, 
    sendUserResults, 
    setRevealExtraWord,
    setRevealAllWords
 }) => {
    const [selectedSentences, setSelectedSentences] = useState<Map<number, string>>(new Map());
    const [showPopover, setShowPopover] = useState<number | null>(null);
    const [allWordsSelected, setAllWordsSelected] = useState<boolean>(false);
    const [elements, setElements] = useState<(BreakElementProps | ClickableSentenceProps)[]>([]);
    const [wordToSentenceIndex, setWordToSentenceIndex] = useState<Map<number, number>>(new Map());
    const [totalSentenceCount, setTotalSentenceCount] = useState<number|undefined>();
    const [sentences, setSentences] = useState<string[]>([]);
    // console.log('WordToSentenceIndex', wordToSentenceIndex)
    // Read dark mode from config
    const { theme: themeToken } = theme.useToken();
    const isDarkMode = themeToken.id === 1;

    const { recipeText, annotations } = improvedRecipe;

    const getSentenceStyle = (sentenceIndex: number) => {
        const status = selectedSentences.get(sentenceIndex);
        // console.log('Getting style for sentence', sentenceIndex, status)
        if(!isDarkMode){
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
        }
        else{
            // Dark mode catppucin colors
            switch (status) {
                case 'correct':
                    return { backgroundColor: '#1f2d3d', border: '1px solid #1890ff', borderRadius: '4px', padding: '2px' };
                case 'incorrect':
                    return { backgroundColor: '#3b1f1f', animation: 'fadeBack 1s', borderRadius: '4px', padding: '2px' }; // Light red
                case 'accepted':
                    return { backgroundColor: '#1f3b1f', border: '1px solid #52c41a', borderRadius: '4px', padding: '2px' }; // Light green
                case 'declined':
                    return { backgroundColor: '#3b2e1f', border: '1px solid #faad14', borderRadius: '4px', padding: '2px' }; // Light orange
                default:
                    return {};
            }
        }
    };

    const { indices } = useMemo(() => {
        const indices = new Set<number>();
        Object.values(annotations).forEach(tuples => {
            tuples.forEach(([, index]) => indices.add(index));
        });
        return { indices }
    }, [annotations]);
    
    useEffect(() => {
        setRevealExtraWord(() => () => {
            // Find index that is in annotations but not in selectedWords
            const index = Array.from(indices).find(index => (wordToSentenceIndex.has(index) && !selectedSentences.has(wordToSentenceIndex.get(index)!)));
            if (index !== undefined) {
                setSelectedSentences(prev => {
                    const newSelected = new Map(prev);
                    newSelected.set(wordToSentenceIndex.get(index)!, 'correct');
                    return newSelected;
                });
                setShowPopover(wordToSentenceIndex.get(index)!);
            }
        });
        setRevealAllWords(() => () => {
            // Find ALL indices that are in annotations but not in selectedWords
            const newSelectedSentences = new Map(selectedSentences);
            indices.forEach(index => {
                if (!(wordToSentenceIndex.has(index) && selectedSentences.has(wordToSentenceIndex.get(index)!))) {
                    newSelectedSentences.set(wordToSentenceIndex.get(index)!, 'correct');
                }
            });
            setSelectedSentences(newSelectedSentences);
        });
    }, [selectedSentences, indices, wordToSentenceIndex]);

    useEffect(() => {
        // Count the current accepted + declined word count
        const acceptedSentences = Array.from(selectedSentences.values()).filter((status) => status === 'accepted').length;
        const declinedSentences = Array.from(selectedSentences.values()).filter((status) => status === 'declined').length;
        const totalWords = acceptedSentences + declinedSentences;
        if (totalSentenceCount && totalWords === totalSentenceCount && !allWordsSelected) {
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
    }, [selectedSentences, totalSentenceCount]);

    const finishReview = () => {
        const res: BackendUserResultDetails = {
            improvedRecipe: recipeText,
            selectedIndexes: selectedSentences,
            timestamp: new Date().toISOString(),
            sentences: sentences,
            mode: 'sentence',
        };
        // console.log('Sending to trace backend: ', res)
        sendUserResults(res);
    };
    useEffect(()=>{
        const handleAccept = (sentenceIndex: number) => {
            setSelectedSentences(prev => {
                const newSelected = new Map(prev);
                newSelected.set(sentenceIndex, 'accepted');
                return newSelected;
            });
            setShowPopover(null);
        };
        
        const handleDecline = (sentenceIndex: number) => {
            setSelectedSentences(prev => {
                const newSelected = new Map(prev);
                newSelected.set(sentenceIndex, 'declined');
                return newSelected;
            });
            setShowPopover(null);
        };

        let wordIndex = 0; // Tracks the index of words across all sentences
        let sentenceIndex = 0; // Tracks the index of sentences
        const wordIndexToSentenceIndex = new Map<number, number>();
        let totalSentenceCount = 0;
        const sentences:string[] = []
        const elementsToAdd:(ClickableSentenceTempProps|BreakElementProps)[] = recipeText.split('\n').flatMap((line, _) => {
            if (line.trim().length === 0) {
                return {} as BreakElementProps
            }
            // Grab each sentence from the line
            let lineMatch = line.match(/\(?[^\.\?\!]+[\.!\?]\)?/g);
            if (lineMatch === null) {
                lineMatch = [line]
            }
            const sentenceElements =  lineMatch.map((sentence, _) => {
                // Boundary calculation
                const wordsInSentence = sentence.split(/\s+/)
                const currentSentenceIndex = sentenceIndex;
                sentenceIndex += 1;
                // Iterate over the annotations and find the words that are in the sentence
                const wordAnnotations = Object.entries(annotations).filter(([word, _]) => {
                    return wordsInSentence.includes(word);
                });
                let wordIndexes: {word: string, wordIndex: number}[];
                if (wordAnnotations !== undefined) {

                    wordIndexes = wordAnnotations.map(([_, wordAnnotations]) => {
                        return wordAnnotations.map(([word, wordIndex]) => ({
                            word: word,
                            wordIndex: wordIndex,
                        }));
                    }).flat();
                    
                    // Map the wordIndexes to the sentenceIndex
                    // console.log('Sentence', currentSentenceIndex, 'has words', wordAnnotations)
                    wordIndexes.forEach(({word: _, wordIndex}) => {
                        wordIndexToSentenceIndex.set(wordIndex, currentSentenceIndex);
                    });

                    if(wordIndexes.length > 0){
                        totalSentenceCount += 1;
                    }
                }
                else {
                    wordIndexes = [];
                }

                const toggleSentenceSelection = () => {
                    if (wordIndexes.length > 0) {
                        setSelectedSentences(prev => {
                            const newSelected = new Map(prev);
                            newSelected.set(currentSentenceIndex, 'correct');
                            return newSelected;
                        });
                        setShowPopover(currentSentenceIndex);
                    } else {
                        setSelectedSentences(prev => {
                            const newSelected = new Map(prev);
                            newSelected.set(currentSentenceIndex, 'incorrect');
                            return newSelected;
                        });
                        // Clear incorrect status after animation duration
                        setTimeout(() => {
                            setSelectedSentences((prev) => {
                                const newSelected = new Map(prev);
                                newSelected.delete(currentSentenceIndex);
                                return newSelected;
                            });
                        }, 1000);
                    }
                };
                sentences.push(sentence)
                return (
                    {
                        sentence: sentence,
                        index: currentSentenceIndex,
                        onAccept: handleAccept,
                        onDecline: handleDecline,
                        toggleSelection: toggleSentenceSelection,
                        wordsIncluded: wordIndexes,
                    } as ClickableSentenceTempProps
                );
            });

            // Add a line break after each line
            return [...sentenceElements as ClickableSentenceTempProps[], {} as BreakElementProps];
        });
        setElements(elementsToAdd);
        setWordToSentenceIndex(wordIndexToSentenceIndex);
        setTotalSentenceCount(totalSentenceCount);
        setSentences(sentences);
    }, [recipeText, annotations]);

    // Animation classes added to the elements
    const submitButtonClass = allWordsSelected ? "submit-button-enter" : "";
    const congratsClass = allWordsSelected ? "congrats-text-enter" : "";
    return (
        <Form layout="vertical">
            <Form.Item>
                <div style={{ whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                    {
                        elements.map((element, index) => {
                            if ('sentence' in element) {
                                return (
                                    <ClickableSentence
                                        key={`sentence-${index}`}
                                        {...element}
                                        showPopover={showPopover === element.index}
                                        sentenceStyle={getSentenceStyle(element.index)}
                                        setShowPopover={setShowPopover}
                                    />
                                );
                            } else {
                                return <br key={`br-${index}`} />;
                            }
                        })
                    }
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


export default ImprovedRecipeDisplaySentenceScale;
