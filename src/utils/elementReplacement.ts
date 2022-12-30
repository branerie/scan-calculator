import { ElementWithId } from './types/index'

export default class ElementReplacement {
  private _aggregate: ReplacementAggregate
  private _currStepIndex
  private _steps: ReplacementStep[]

  constructor(
    steps: ReplacementStep[] = [], 
    initialStepIndex = -1, 
    aggregate: ReplacementAggregate = null
  ) {
    this._currStepIndex = initialStepIndex
    this._steps = steps
    this._aggregate = aggregate
  }

  get aggregate() {
    if (this._aggregate) {
      return {
        added: new Map(this._aggregate.added),
        removed: new Map(this._aggregate.removed),
        archived: new Map(this._aggregate.archived),
      }
    }

    return null
  }

  get current() {
    const currentStep = this._steps[this._currStepIndex]
    if (!currentStep) return null

    return {
      added: { ...currentStep.added },
      removed: { ...currentStep.removed }
    }
  }

  get next() {
    const nextStep = this._steps[this._currStepIndex + 1]
    if (!nextStep) return null

    return {
      added: { ...nextStep.added },
      removed: { ...nextStep.removed },
    }
  }

  get previous() {
    const prevStep = this._steps[this._currStepIndex - 1]
    if (!prevStep) return null

    return {
      added: { ...prevStep.added },
      removed: { ...prevStep.removed },
    }
  }

  addStep(step: ReplacementStep) {
    if (!this._aggregate) {
      this._aggregate = { 
        added: { ...step.added }, 
        removed: { ...step.removed }, 
        archived: new Map() 
      }

      this._steps.push(step)
      this._currStepIndex++
      return
    }

    for (const [removedId, removed] of step.removed.entries()) {
      if (this._aggregate.added.has(removedId)) {
        // element was added by a previous step
        this._aggregate.added.delete(removedId)
        this._aggregate.archived.set(removedId, removed)
      } else {
        this._aggregate.removed.set(removedId, removed)
      }
    }

    for (const [addedId, added] of step.added.entries()) {
      this._aggregate.added.set(addedId, added)
    }

    if (this._steps.length > this._currStepIndex + 1) {
      // we have used an "undo command" and are currently
      // writing over it
      this._steps = this._steps.slice(0, this._currStepIndex + 1)
    }

    this._steps.push(step)
    this._currStepIndex++
  }

  undo() {
    if (this._currStepIndex < 0 || !this._aggregate) return false

    this._aggregate = {
      added: new Map(this._aggregate.added),
      removed: new Map(this._aggregate.removed),
      archived: new Map(this._aggregate.archived),
    }

    const undoneStep = this._steps[this._currStepIndex]
    for (const addedId of Object.keys(undoneStep.added)) {
      this._aggregate.added.delete(addedId)
    }
    
    for (const [removedId, removed] of Object.entries(undoneStep.removed)) {
      this._aggregate.removed.delete(removedId)

      if (this._aggregate.archived.delete(removedId)) {
        // element was added by a previous step, so we need to re-add it
        this._aggregate.added.set(removedId, removed)
        this._aggregate.archived.delete(removedId)
      }
    }

    this._currStepIndex--
    return true
  }

  redo() {
    if (this._currStepIndex >= this._steps.length) return false

    this._aggregate = this._copyAggregate()!

    this._currStepIndex++
    const redoneStep = this._steps[this._currStepIndex]
    for (const [addedId, added] of Object.entries(redoneStep.added)) {
      this._aggregate.added.set(addedId, added)
    }

    for (const [removedId, removed] of Object.entries(redoneStep.removed)) {
      if (this._aggregate.added.has(removedId)) {
        // element was added by a previous step
        this._aggregate.added.delete(removedId)
        this._aggregate.archived.set(removedId, removed)
      } else {
        this._aggregate.removed.set(removedId, removed)
      }
    }

    return true
  }

  clone() {
    let newAggregate: ReplacementAggregate = null
    if (this._aggregate) {
      newAggregate = this._copyAggregate()
    }

    return new ElementReplacement(
      [...this._steps], 
      this._currStepIndex, 
      newAggregate
    )
  }

  private _copyAggregate(): ReplacementAggregate {
    if (this._aggregate) {
      return {
        added: new Map(this._aggregate.added),
        removed: new Map(this._aggregate.removed),
        archived: new Map(this._aggregate.archived),
      }
    }

    return null
  }
}

type ReplacementStep = {
  added: Map<string, ElementWithId>,
  removed: Map<string, ElementWithId>
}

type ReplacementAggregate = (ReplacementStep & { archived: Map<string, ElementWithId> }) | null