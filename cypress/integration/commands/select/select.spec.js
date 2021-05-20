import { click, matchSnapshot, moveMouse, pressEnter, pressEscape, selectTool } from '../../../utils/canvas'
import { visitPage } from '../../../utils/main'

describe('Elements select command', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    const drawElements = () => {
        selectTool('line')
        click(50, 50)
        click(200, 50)
    
        selectTool('arc')
        click(50, 400)
        click(50, 450)
        click(50, 350)
    
        selectTool('polyline')
        click(100, 50)
        click(150, 200)
        click(200, 100)
        click(250, 180)
        pressEnter()
    
        selectTool('circle')
        click(400, 200)
        click(400, 100)
    
        selectTool('rectangle')
        click(500, 200)
        click(600, 600)

        pressEscape()
        pressEscape()
    }
    
    it('should select elements by single click on them', () => {
        drawElements()

        click(150, 50)
        click(100, 400)
        click(100, 50)
        click(400, 100)
        click(500, 400)
    })

    it('should select elements by single click on them (other points)', () => {
        drawElements()

        click(200, 50)
        click(50, 350)
        click(225, 140)
        click(470.71, 270.71)
        click(600, 600)
    })

    it('should select elements by partial select window', () => {
        drawElements()

        click(60, 10)
        click(20, 80)

        click(170, 180)
        click(130, 240)

        click(130, 450)
        click(110, 380)

        click(540, 230)
        click(470, 140)
    })

    it('should select elements by partial select window (other selection windows)', () => {
        drawElements()

        click(260, 30)
        click(10, 70) // should select line and polyline

        click(70, 380)
        click(30, 420) // should NOT select arc by center

        click(330, 260)
        click(260, 340) // should select circle

        click(700, 500)
        click(550, 400) // should select rectangle
    })

    it('should not select partial elements with whole-select window', () => {
        drawElements()
        
        click(250, 50)
        click(700, 400)

        click(50, 80)
        click(300, 140)

        click(20, 300)
        click(150, 449)
    })

    it('should select whole elements with whole-select window', () => {
        drawElements()

        click(60, 30)
        click(700, 700)
    })
})