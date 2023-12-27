import React, { createContext, useState, RefObject, Dispatch, SetStateAction, ReactNode } from 'react';

export interface IPageRef {
  title: string;
  content: string;
  target: RefObject<HTMLElement>;
  onNext?: () => void;
  onClose?: () => void;
  preventClose?: boolean;
}

interface ITourContext {
  tourOpen: boolean;
  setTourOpen: Dispatch<SetStateAction<boolean>>;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  startTour: (refs: IPageRef[]) => void;
  pageRefs: IPageRef[];
  doTour: boolean;
  setDoTour: Dispatch<SetStateAction<boolean>>;
  tourStep: number;
  setTourStep: Dispatch<SetStateAction<number>>;
}



const defaultState: ITourContext = {
  tourOpen: false,
  setTourOpen: () => {},
  currentPage: -1,
  setCurrentPage: () => {},
  startTour: () => {},
  pageRefs: [],
  doTour: false,
  setDoTour: () => {},
  tourStep: 0,
  setTourStep: () => {},
};

export const TourContext = createContext<ITourContext>(defaultState);

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [tourOpen, setTourOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(-1);
  const [pageRefs, setPageRefs] = useState<IPageRef[]>([]);
  const [doTour, setDoTour] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);

  const startTour = (refs: IPageRef[]) => {
    setTourStep(0);
    setPageRefs(refs);
    setTourOpen(true);
  };

  return (
    <TourContext.Provider value={{ doTour, setDoTour, tourOpen, setTourOpen, currentPage, setCurrentPage, startTour, pageRefs, tourStep, setTourStep }}>
      {children}
    </TourContext.Provider>
  );
};
