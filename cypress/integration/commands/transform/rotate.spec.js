import { click, matchSnapshot, moveMouse, pressEnter, pressEscape, selectTool } from '../../../utils/canvas'
import { undo, visitPage } from '../../../utils/main'
import { createAndSelectMultipleElements } from './utils'

describe('Elements rotate command', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    it('should rotate single element correctly', () => {
        selectTool('polyline')
        click(50, 50)
        click(150, 150)
        click(180, 220)
        click(100, 280)
        click(400, 230)
        pressEnter()
        pressEscape()

        click(50, 50)
        selectTool('rotate')

        click(300, 50)
        click(500, 15)
    })

    it('should rotate multiple elements correctly (selected only)', () => {
        createAndSelectMultipleElements()

        selectTool('rotate')
        click(10, 510)
        click(100, 480)
    })

    it('should rotate elements with mouse while executing rotate command', () => {
        createAndSelectMultipleElements()

        selectTool('rotate')
        click(10, 510)
        moveMouse(100, 450)
    })

    it('should undo rotate correctly', () => {
        createAndSelectMultipleElements()

        selectTool('rotate')
        click(10, 510)
        click(20, 200)

        undo()
    })
})