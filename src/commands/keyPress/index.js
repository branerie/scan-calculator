import { useCallback } from 'react'
import useDeleteCommand from './useDeleteCommand'
import useEnterCommand from './useEnterCommand'
import useEscapeCommand from './useEscapeCommand'
import useUndoRedoCommand from './useUndoRedoCommand'

const useKeyPressCommands = () => {
    const commands = {
        undoRedo: useUndoRedoCommand(),
        delete: useDeleteCommand(),
        enter: useEnterCommand(),
        escape: useEscapeCommand()
    }

    const executeKeyPressCommand = useCallback((event) => {
        if ((event.metaKey || event.ctrlKey) && (event.key === 'z' || event.key === 'y')) {
            commands.undoRedo(event)
            return
        }
    
        if (event.keyCode === 27) { // escape
            commands.escape(event)
            return
        }
        
        if (event.keyCode === 13) { // enter
            commands.enter(event)
            return
        }
        
        if (event.keyCode === 46) { // delete
            commands.delete()
            return
        }
    
        return null
    }, [commands])

    return executeKeyPressCommand
}

export default useKeyPressCommands