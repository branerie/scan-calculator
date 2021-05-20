import { useCallback } from 'react'
import { useToolsContext } from '../../contexts/ToolsContext'
import useCopyCommand from './useCopyCommand'
import useDeleteCommand from './useDeleteCommand'
import useEnterCommand from './useEnterCommand'
import useEscapeCommand from './useEscapeCommand'
import useUndoRedoCommand from './useUndoRedoCommand'

const ENTER_KEY_CODE = 13
const ESCAPE_KEY_CODE = 27
const DELETE_KEY_CODE = 46

const useKeyPressCommands = () => {
    const commands = {
        undoRedo: useUndoRedoCommand(),
        delete: useDeleteCommand(),
        enter: useEnterCommand(),
        escape: useEscapeCommand(),
        copy: useCopyCommand(),
    }

    const { tool } = useToolsContext()

    const executeKeyPressCommand = useCallback((event) => {
        if ((event.metaKey || event.ctrlKey) && (event.key === 'z' || event.key === 'y')) {
            commands.undoRedo(event)
            return
        }

        const { keyCode } = event
        if (tool.type === 'copy' && (keyCode === ESCAPE_KEY_CODE || keyCode === ENTER_KEY_CODE)) {
            commands.copy(event)
            return
        }
    
        if (keyCode === ESCAPE_KEY_CODE) { // escape
            commands.escape(event)
            return
        }
        
        if (keyCode === ENTER_KEY_CODE) { // enter
            commands.enter(event)
            return
        }
        
        if (keyCode === DELETE_KEY_CODE) { // delete
            commands.delete()
            return
        }
    
        return null
    }, [commands, tool.type])

    return executeKeyPressCommand
}

export default useKeyPressCommands