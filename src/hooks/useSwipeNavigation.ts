import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

interface UseSwipeNavigationReturn {
  swipeToNext: () => void;
  swipeToPrevious: () => void;
  canSwipeNext: boolean;
  canSwipePrevious: boolean;
  currentSection: string;
}

export function useSwipeNavigation(): UseSwipeNavigationReturn {
  const navigate = useNavigate();
  const location = useLocation();

  // Define a ordem das seções principais
  const mainSections = [
    '/obras-hub',
    '/dashboard',
    '/financeiro-hub',
  ];

  // Encontra a seção atual
  const getCurrentSectionIndex = useCallback(() => {
    const path = location.pathname;
    
    // Verifica se está em uma sub-página
    if (path.startsWith('/obras') || path === '/gestao-obras' || path === '/propostas' || path === '/minhas-obras') {
      return mainSections.indexOf('/obras-hub');
    }
    if (path.startsWith('/caixa') || path === '/receber' || path === '/dividas') {
      return mainSections.indexOf('/financeiro-hub');
    }
    
    // Seção principal
    return mainSections.indexOf(path);
  }, [location.pathname]);

  const currentIndex = getCurrentSectionIndex();
  const currentSection = currentIndex !== -1 ? mainSections[currentIndex] : location.pathname;

  const swipeToNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < mainSections.length) {
      navigate(mainSections[nextIndex]);
    }
  }, [currentIndex, navigate]);

  const swipeToPrevious = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      navigate(mainSections[prevIndex]);
    }
  }, [currentIndex, navigate]);

  return {
    swipeToNext,
    swipeToPrevious,
    canSwipeNext: currentIndex < mainSections.length - 1,
    canSwipePrevious: currentIndex > 0,
    currentSection,
  };
}
