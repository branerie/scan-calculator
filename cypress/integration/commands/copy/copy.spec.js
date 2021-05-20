import { selectTool, click, pressEscape, matchSnapshot, pressEnter } from '../../../utils/canvas'
import { undo, visitPage } from '../../../utils/main'

describe('Elements copy command', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    const copyElements = () => {
        selectTool('line')
        click(100, 100)
        click(100, 300)

        selectTool('polyline')
        click(150, 200)
        click(240, 80)
        click(330, 140)
        click(400, 60)
        pressEnter()

        selectTool('arc')
        click(500, 500)
        click(500, 600)
        click(500, 400)
        pressEscape()

        click(100, 200)
        click(150, 200)
        click(600, 500)

        selectTool('copy')
        click(50, 50)
        click(150, 150)
        click(500, 150)
        pressEscape()
        pressEscape()
    }

    it('should copy single element correctly', () => {
        selectTool('line')
        click(50, 50)
        click(150, 50)

        pressEscape()
        click(100, 50)
        selectTool('copy')
        click(100, 100)
        click(200, 200)
        click(200, 300)

        pressEscape()
        selectTool('circle')
        click(350, 350)
        click(450, 350)

        pressEscape()
        click(450, 350)
        selectTool('copy')
        click(30, 30)
        click(330, 30)
        click(330, 330)
        click(30, 330)
        pressEscape()
        pressEscape()
    })

    it('should copy multiple elements correctly', () => {
        copyElements()
    })

    it('should undo correctly', () => {
        copyElements()
        undo()
    })
})