import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useDragCommand = () => {
    const {
        tools: {
            mouseDrag, 
            panView
        }
    } = useAppContext()

    const handleDragCmd = useCallback((event) => {
        const { clientX, clientY } = event
        panView(mouseDrag[0], mouseDrag[1], clientX, clientY)
    }, [mouseDrag, panView])

    return handleDragCmd
}

export default useDragCommand