import Arc from "../../drawingElements/arc"
import Line from "../../drawingElements/line"
import Point from "../../drawingElements/point"
import { SELECT_DELTA } from "../../utils/constants"

describe('arc', () => {
    describe('radius.setter', () =>{
        it('should set radius and change arc points correctly', () => {
            const arc = new Arc(new Point(50, 50), { 
                startLine: new Line(new Point(50, 50), { pointB: new Point(100, 50) }),
                endLine: new Line(new Point(50, 50), { pointB: new Point(50, 100) }),
            })

            expect(arc.startPoint).toEqual({ x: 100, y: 50 })
            expect(arc.endPoint).toEqual({ x: 50, y: 100 })
            expect(arc.radius).toEqual(50)

            arc.radius = 25
            expect(arc.startPoint.x).toEqual(75)
            expect(arc.endPoint.y).toEqual(75)
            expect(arc.radius).toEqual(25)
        })
    })

    describe('getSelectionPoints', () => {
        it('should retrieve correct selection points', () => {
            const arc = new Arc(new Point(50, 50), { 
                startLine: new Line(new Point(50, 50), { pointB: new Point(50, 100) }),
                endLine: new Line(new Point(50, 50), { pointB: new Point(50, 0) }),
            })

            const selectionPoints = arc.getSelectionPoints()

            expect(selectionPoints.length).toEqual(4)

            const centerPoint = selectionPoints.find(sp => sp.pointType === 'center')
            expect(centerPoint).not.toBeNull()
            expect(centerPoint.x).toEqual(50)
            expect(centerPoint.y).toEqual(50)

            const [startPoint, endPoint] = selectionPoints.filter(sp => sp.pointType === 'endPoint')
            expect(startPoint).not.toBeNull()
            expect(endPoint).not.toBeNull()

            expect(startPoint.x).toEqual(50)
            expect(startPoint.y).toEqual(100)

            expect(endPoint.x).toEqual(50)
            expect(endPoint.y).toEqual(0)

            const midPoint = selectionPoints.find(sp => sp.pointType === 'midPoint')
            expect(midPoint).not.toBeNull()
            expect(midPoint.x).toEqual(100)
            expect(midPoint.y).toEqual(50)
        })
    })

    describe('checkIfPointOnElement', () => {
        it('should return true if point lies on arc', () => {
            const arc = new Arc(new Point(427, 506), {
                startLine: new Line(new Point(427, 506), { pointB: new Point(698, 374) })
            })

            arc.setLastAttribute(595, 282)

            expect(arc.checkIfPointOnElement(new Point(698, 374), SELECT_DELTA)).toEqual(true)
            expect(arc.checkIfPointOnElement(new Point(690, 359), SELECT_DELTA)).toEqual(true)

            const arc2 = new Arc(new Point(548, 521), {
                startLine: new Line(new Point(548, 521), { pointB: new Point(651, 229) })
            })

            arc2.setLastAttribute(704, 252)

            expect(arc2.checkIfPointOnElement(new Point(651, 229), SELECT_DELTA)).toEqual(true)
            expect(arc2.checkIfPointOnElement(new Point(704, 252), SELECT_DELTA)).toEqual(true)
        })

        it('should return false if point does not lie on arc', () => {
            const arc = new Arc(new Point(501, 549), {
                startLine: new Line(new Point(501, 549), { pointB: new Point(694, 424) })
            })

            arc.setLastAttribute(510, 312)

            expect(arc.checkIfPointOnElement(new Point(arc.centerPoint.x - arc.radius, arc.centerPoint.y))).toEqual(false)
            expect(arc.checkIfPointOnElement(new Point(50, 50))).toEqual(false)

            const arc2 = new Arc(new Point(632, 327), {
                startLine: new Line(new Point(632, 327), { pointB: new Point(615, 438) })
            })

            arc2.setLastAttribute(575, 401)

            expect(arc2.checkIfPointOnElement(
                new Point(arc2.centerPoint.x + arc2.radius, arc2.centerPoint.y), 
                SELECT_DELTA)
            ).toEqual(true)
            expect(arc2.checkIfPointOnElement(new Point(597, 433), SELECT_DELTA)).toEqual(false)
            expect(arc2.checkIfPointOnElement(new Point(200, 200), SELECT_DELTA)).toEqual(false)
            expect(arc2.checkIfPointOnElement(new Point(arc2.centerPoint.x, arc2.centerPoint.y), SELECT_DELTA)).toEqual(false)
        })
    })

    describe('setLastAttribute', () => {
        it('should set endPoint correctly and change arc to fully defined', () => {
            const arc = new Arc(new Point(50, 50), { 
                startLine: new Line(new Point(50, 50), { pointB: new Point(100, 50) })
            })

            expect(arc.isFullyDefined).toEqual(false)

            arc.setLastAttribute(50, 120)
            
            expect(arc.isFullyDefined).toEqual(true)
            expect(arc.radius).toEqual(50)
            expect(arc.endPoint.x).toEqual(50)
            expect(arc.endPoint.y).toEqual(100)
        })


        it('should update arc midPoint', () => {
            const arc = new Arc(new Point(50, 50), { 
                startLine: new Line(new Point(50, 50), { pointB: new Point(50, 100) })
            })

            arc.setLastAttribute(50, 0)

            expect(arc.midLine.pointB.x).toEqual(100)
            expect(arc.midLine.pointB.y).toEqual(50)

            arc.setLastAttribute(100, 50)
            expect(arc.midLine.pointB.x).toEqual(arc.centerPoint.x + Math.sqrt(2) / 2 * arc.radius)
            expect(arc.midLine.pointB.y).toEqual(arc.centerPoint.y + Math.sqrt(2) / 2 * arc.radius)
        })
    })

    describe('defineNextAttribute', () => {
        it('should set radius and startPoint if not defined', () => {
            const arc = new Arc(new Point(50, 50))

            expect(arc.radius).toBeNull()
            expect(arc.startLine).toBeNull()
            expect(arc.endLine).toBeNull()

            arc.defineNextAttribute(new Point(50, 100))

            expect(arc.radius).toEqual(50)
            expect(arc.startPoint.x).toEqual(50)
            expect(arc.startPoint.y).toEqual(100)
            expect(arc.endLine).toBeNull()
        })

        it('should not set radius and startPoint if already defined', () => {
            const arc = new Arc(new Point(50, 50), { 
                startLine: new Line(new Point(50, 50), { pointB: new Point(50, 100) })
            })

            arc.defineNextAttribute(new Point(200, 200))

            expect(arc.radius).toEqual(50)
            expect(arc.startPoint.x).toEqual(50)
            expect(arc.startPoint.y).toEqual(100)
            expect(arc.endLine).toBeNull()
        })
    })

    describe('getPointById', () => {
        it('should retrieve correct point by id', () => {
            const startPoint = new Point(50, 100)
            startPoint.pointId = 1

            const endPoint = new Point(50, 0)
            endPoint.pointId = 2

            const arc = new Arc(new Point(50, 50), { 
                startLine: new Line(new Point(50, 50), { pointB: startPoint }),
                endLine: new Line(new Point(50, 50), { pointB: endPoint }),
            })

            
            expect(arc.getPointById(1)).toEqual(startPoint)
            expect(arc.getPointById(2)).toEqual(endPoint)

            expect(arc.getPointById(1).x).toEqual(startPoint.x)
            expect(arc.getPointById(1).y).toEqual(startPoint.y)
            
            expect(arc.getPointById(2).x).toEqual(endPoint.x)
            expect(arc.getPointById(2).y).toEqual(endPoint.y)
            
            arc.midLine.pointB.pointId = 3
            expect(arc.getPointById(3)).toEqual(arc.midLine.pointB)
            expect(arc.getPointById(3).x).toEqual(arc.midLine.pointB.x)
            expect(arc.getPointById(3).y).toEqual(arc.midLine.pointB.y)
        })

        it('should return null if point not found', () => {
            const startPoint = new Point(50, 100)
            startPoint.pointId = 1

            const endPoint = new Point(50, 0)
            endPoint.pointId = 2

            const arc = new Arc(new Point(50, 50), { 
                startLine: new Line(new Point(50, 50), { pointB: startPoint }),
                endLine: new Line(new Point(50, 50), { pointB: endPoint }),
            })

            expect(arc.getPointById(4)).toBeNull()
        })
    })

    describe('setPointById', () => {
        it('should set correct point', () => {
            const startPoint = new Point(50, 100)
            startPoint.pointId = 1

            const endPoint = new Point(50, 0)
            endPoint.pointId = 2

            const arc = new Arc(new Point(50, 50), { 
                startLine: new Line(new Point(50, 50), { pointB: startPoint }),
                endLine: new Line(new Point(50, 50), { pointB: endPoint }),
            })

            expect(arc.setPointById(1, 100, 50)).toEqual(true)
            expect(arc.setPointById(2, 0, 50)).toEqual(true)
            expect(arc.setPointById(3, 200, 200)).toEqual(false)

            expect(arc.startLine.pointB.x).toEqual(100)
            expect(arc.startLine.pointB.y).toEqual(50)

            expect(arc.endLine.pointB.x).toEqual(0)
            expect(arc.endLine.pointB.y).toEqual(50)
        })

        it('should adjust point to radius length from center', () => {
            const startPoint = new Point(50, 100)
            startPoint.pointId = 1

            const endPoint = new Point(50, 0)
            endPoint.pointId = 2

            const arc = new Arc(new Point(50, 50), { 
                startLine: new Line(new Point(50, 50), { pointB: startPoint }),
                endLine: new Line(new Point(50, 50), { pointB: endPoint }),
            })

            expect(arc.setPointById(1, 200, 50)).toEqual(true)

            expect(arc.radius).toEqual(50)
            expect(arc.startLine.pointB.x).toEqual(100)
            expect(arc.startLine.pointB.y).toEqual(50)
        })
    })

    describe('move', () => {
        it('should move whole arc correctly', () => {
            const arc = new Arc(new Point(50, 50), { 
                startLine: new Line(new Point(50, 50), { pointB: new Point(50, 100) }),
                endLine: new Line(new Point(50, 50), { pointB: new Point(50, 0) }),
            })

            arc.move(50, 50)

            expect(arc.centerPoint.x).toEqual(100)
            expect(arc.centerPoint.y).toEqual(100)

            expect(arc.startLine.pointB.x).toEqual(100)
            expect(arc.startLine.pointB.y).toEqual(150)

            expect(arc.endLine.pointB.x).toEqual(100)
            expect(arc.endLine.pointB.y).toEqual(50)

            expect(arc.midLine.pointB.x).toEqual(150)
            expect(arc.midLine.pointB.y).toEqual(100)

            arc.move(-100, -100)

            expect(arc.centerPoint.x).toEqual(0)
            expect(arc.centerPoint.y).toEqual(0)

            expect(arc.startLine.pointB.x).toEqual(0)
            expect(arc.startLine.pointB.y).toEqual(50)

            expect(arc.endLine.pointB.x).toEqual(0)
            expect(arc.endLine.pointB.y).toEqual(-50)

            expect(arc.midLine.pointB.x).toEqual(50)
            expect(arc.midLine.pointB.y).toEqual(0)
        })
    })
})