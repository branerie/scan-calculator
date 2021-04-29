import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'

const useUndoRedoCommand = () => {
    const {
        history: {
            undo,
            redo
        }
    } = useElementsContext()

    const handleUndoRedoCmd = useCallback((event) => {
        if (event.key === 'z') {
            undo()
            return
        }
        
        if (event.key === 'y') {
            redo()
        }
    }, [undo, redo])

    return handleUndoRedoCmd
}

export default useUndoRedoCommand