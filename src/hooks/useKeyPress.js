import { useCallback } from 'react'

const useKeyPress = () => {
    const undoIsPressed = useCallback((event) => {
        console.log(event.ctrlKey && event.key === 'z')
        return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z'
    }, [])
    
    const redoIsPressed = useCallback((event) => {
        return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y'
    }, [])
    
    return {
        undoIsPressed,
        redoIsPressed
    }
}

export default useKeyPress