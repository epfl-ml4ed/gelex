import React, { useMemo } from 'react';
import { Steps } from 'antd';

type GuiderProps = {
    currentStep: number;
}

export const Guider: React.FC<GuiderProps> = ({currentStep}) => {

    const descriptions = useMemo(() => [
        'Write your recipe! And click submit to get a new recipe!',
        'We are cooking your improved recipe! Please wait!',
        'Your new recipe is here! Click on the words you think are new!',
        'You are done!',
    ].map((description, index) => {
        if (index === currentStep) {
            return description;
        }
        return '';
    }), [currentStep]);

    return(
    <Steps
        current={currentStep}
        items={[
        {
            title: 'Your Recipe',
            description: descriptions[0],
        },
        {
            title: 'Wait for it!',
            description: descriptions[1],
        },
        {
            title: 'Mark the changes!',
            description: descriptions[2],
        },
        {
            title: 'Done!',
            description: descriptions[3],
        },
        ]}
    />
    )
};

export default Guider;
