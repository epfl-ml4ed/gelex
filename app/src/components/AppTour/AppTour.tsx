import React, { useContext } from 'react';
import { Tour, TourProps } from 'antd';
import { TourContext } from './TourContext';
import './AppTour.css'

export const AppTour: React.FC = () => {
  const { tourOpen, setTourOpen, pageRefs, setTourStep, tourStep } = useContext(TourContext);

  const steps:TourProps['steps'] = pageRefs.map((ref, index) => ({
    title: ref.title,
    description: ref.content,
    target: () => ref.target.current as HTMLElement,
    onClose: () => {
      if(ref.onClose){
        ref.onClose();
      }
      if (ref.preventClose) {
        // console.log('Preventing close for ', ref.title)
        return;
      };
      setTourStep(0);
      setTourOpen(false);
    },
    nextButtonProps: {
      onClick: () => {
        if(ref.onNext){
          ref.onNext();
        }
        if (index < pageRefs.length - 1) {
          // console.log('calling setTourStep to ', index+1)
          setTourStep(index+1);
        }
        else if(index === pageRefs.length - 1) {
          if(ref.preventClose){
            // console.log('Preventing close for ', ref.title)
            return
          }
          // console.log('Calling onClose for ', ref.title)
          ref.onClose && ref.onClose();
          setTourStep(0);
          setTourOpen(false);
        }
      },
    }
  }));

  return <Tour open={tourOpen} steps={steps} onClose={() => setTourOpen(false)} current={tourStep}/>;
};

export default AppTour;
