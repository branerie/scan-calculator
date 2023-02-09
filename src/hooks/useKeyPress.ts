import { useCallback } from 'react'

const useKeyPress = () => {
  const undoIsPressed = useCallback((event: KeyboardEvent) => {
    return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z'
  }, [])
  
  const redoIsPressed = useCallback((event: KeyboardEvent) => {
    return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y'
  }, [])
  
  return {
    undoIsPressed,
    redoIsPressed
  }
}

export default useKeyPress