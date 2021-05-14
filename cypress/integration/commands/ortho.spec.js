import { click, matchSnapshot, pressEscape, selectTool } from '../../utils/canvas'
import { visitPage } from '../../utils/main'

describe('Ortho', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    it('should create 90/180/270-degree lines', () => {
        selectTool('line')
        selectTool('ortho')

        click(100, 100)
        click(100, 130)

        click(100, 200)
        click(100, 160)

        click(200, 500)
        click(380, 550)

        click(400, 100)
        click(620, 80)
    })

    it('should create 90-degree arcs', () => {
        selectTool('arc')
        selectTool('ortho')

        click(300, 300)
        click(520, 330)
        click(350, 220)

        click(300, 300)
        click(440, 330)
        click(160, 270)

        click(300, 300)
        click(360, 330)
        click(290, 480)
    })

    it('should rotate elements by increments of 90 degrees', () => {
        selectTool('line')
        click(100, 100)
        click(100, 130)

        selectTool('circle')
        click(200, 200)
        click(300, 200)

        selectTool('rectangle')
        click(320, 320)
        click(600, 400)

        pressEscape()
        click(100, 100)
        click(300, 200)
        click(350, 320)

        selectTool('rotate')
        selectTool('ortho')
        click(300, 300)
        click(340, 220)
    })
})