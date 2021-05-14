import { click, matchSnapshot, moveMouse, pressEscape, selectTool } from '../../../utils/canvas'
import { undo, visitPage } from '../../../utils/main'
import { createAndSelectMultipleElements } from './utils'

describe('Elements move command', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    it('should move single element correctly', () => {
        selectTool('line')
        click(50, 50)
        click(150, 150)
        pressEscape()

        click(50, 50)
        selectTool('move')

        click(300, 50)
        click(500, 50)
    })

    it('should move multiple elements correctly (selected only)', () => {
        createAndSelectMultipleElements()

        selectTool('move')
        click(10, 10)
        click(360, 10)
    })

    it('should move elements with mouse while executing move command', () => {
        createAndSelectMultipleElements()

        selectTool('move')
        click(10, 10)
        moveMouse(220, 180)
    })

    it('should undo move correctly', () => {
        createAndSelectMultipleElements()

        selectTool('move')
        click(10, 10)
        click(160, 10)

        undo()
    })
})