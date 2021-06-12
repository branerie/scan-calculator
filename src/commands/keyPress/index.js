import { useCallback } from 'react'
import { useToolsContext } from '../../contexts/ToolsContext'
import useCopyCommand from './useCopyCommand'
import useDeleteCommand from './useDeleteCommand'
import useDrawCommand from './useDrawCommand'
import useEscapeCommand from './useEscapeCommand'
import useTrimCommand from './useTrimCommand'
import useUndoRedoCommand from './useUndoRedoCommand'
import { ENTER_KEY_CODE, ESCAPE_KEY_CODE, DELETE_KEY_CODE, SPACE_KEY_CODE } from '../../utils/constants'


const useKeyPressCommands = () => {
    const commands = {
        undoRedo: useUndoRedoCommand(),
        delete: useDeleteCommand(),
        draw: useDrawCommand(),
        escape: useEscapeCommand(),
        copy: useCopyCommand(),
        trim: useTrimCommand(),
    }

    const { tool } = useToolsContext()

    const executeKeyPressCommand = useCallback((event) => {
        if ((event.metaKey || event.ctrlKey) && (event.key === 'z' || event.key === 'y') && tool.type === 'select') {
            commands.undoRedo(event)
            return
        }

        if (tool.type === 'trim') {
            commands.trim(event)
            return
        }

        const { keyCode } = event

        if (keyCode === ESCAPE_KEY_CODE) {
            commands.escape(event)
            return
        }
        
        if (keyCode === ENTER_KEY_CODE || keyCode === SPACE_KEY_CODE) {
            if (tool.type === 'draw') {
                commands.draw(event)
                return
            }

            if (tool.type === 'copy') {
                commands.copy(event)
                return
            }
        }
        
        if (keyCode === DELETE_KEY_CODE) {
            commands.delete()
            return
        }
    
        return null
    }, [commands, tool.type])

    return executeKeyPressCommand
}

export default useKeyPressCommands