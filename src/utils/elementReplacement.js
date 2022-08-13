class ElementReplacement {
    #aggregate
    #current
    #currStepIndex
    #steps

    constructor(steps = [], initialStepIndex = -1, aggregate = null) {
        this.#currStepIndex = initialStepIndex
        this.#steps = steps
        this.#current = steps ? steps[initialStepIndex] : null
        this.#aggregate = aggregate
    }

    get aggregate() {
        return this.#aggregate
            ? {
                added: { ...this.#aggregate.added },
                removed: { ...this.#aggregate.removed },
                archived: { ...this.#aggregate.archived },
            } 
            : null
    }

    get current() {
        const currentStep = this.#steps[this.#currStepIndex]
        if (!currentStep) return null

        return {
                added: { ...currentStep.added },
                removed: { ...currentStep.removed }
            }
    }

    get next() {
        const nextStep = this.#steps[this.#currStepIndex + 1]
        if (!nextStep) return null

        return {
            added: { ...nextStep.added },
            removed: { ...nextStep.removed },
        }
    }

    get previous() {
        const prevStep = this.#steps[this.#currStepIndex - 1]
        if (!prevStep) return null

        return {
            added: { ...prevStep.added },
            removed: { ...prevStep.removed },
        }
    }

    addStep(step) {
        if (!step.added || !step.removed) {
            throw new Error('Invalid step for element replacement - must contain added and removed elements')
        }

        if (!this.#aggregate) {
            this.#aggregate = { added: { ...step.added }, removed: { ...step.removed }, archived: {} }
            this.#steps.push(step)
            this.#currStepIndex++
            return
        }

        for (const [removedId, removed] of Object.entries(step.removed)) {
            if (this.#aggregate.added[removedId]) {
                // element was added by a previous step
                delete this.#aggregate.added[removedId]
                this.#aggregate.archived[removedId] = removed
            } else {
                this.#aggregate.removed[removedId] = removed
            }
        }

        for (const [addedId, added] of Object.entries(step.added)) {
            this.#aggregate.added[addedId] = added
        }

        if (this.#steps.length > this.#currStepIndex + 1) {
            // we have used an "undo command" and are currently
            // writing over it
            this.#steps = this.#steps.slice(0, this.#currStepIndex + 1)
        }

        this.#steps.push(step)
        this.#currStepIndex++
    }

    undo() {
        if (this.#currStepIndex < 0) return false

        this.#aggregate = {
            added: { ...this.#aggregate.added },
            removed: { ...this.#aggregate.removed },
            archived: { ...this.#aggregate.archived }
        }

        const undoneStep = this.#steps[this.#currStepIndex]
        for (const addedId of Object.keys(undoneStep.added)) {
            delete this.#aggregate.added[addedId]
        }
        
        for (const [removedId, removed] of Object.entries(undoneStep.removed)) {
            delete this.#aggregate.removed[removedId]

            if (this.#aggregate.archived[removedId]) {
                // element was added by a previous step, so we need to re-add it
                this.#aggregate.added[removedId] = removed
                delete this.#aggregate.archived[removedId]
            }
        }

        this.#currStepIndex--
        return true
    }

    redo() {
        if (this.#currStepIndex >= this.#steps.length) return false

        this.#aggregate = {
            added: { ...this.#aggregate.added },
            removed: { ...this.#aggregate.removed },
            archived: { ...this.#aggregate.archived }
        }

        this.#currStepIndex++
        const redoneStep = this.#steps[this.#currStepIndex]
        for (const [addedId, added] of Object.entries(redoneStep.added)) {
            this.#aggregate.added[addedId] = added
        }

        for (const [removedId, removed] of Object.entries(redoneStep.removed)) {
            if (this.#aggregate.added[removedId]) {
                // element was added by a previous step
                delete this.#aggregate.added[removedId]
                this.#aggregate.archived[removedId] = removed
            } else {
                this.#aggregate.removed[removedId] = removed
            }
        }

        return true
    }

    clone() {
        const newAggregate = this.#aggregate
            ? {
                added: { ...this.#aggregate.added },
                removed: { ...this.#aggregate.removed },
                archived: { ...this.#aggregate.archived }
            } 
            : null

        return new ElementReplacement(
            [...this.#steps], 
            this.#currStepIndex, 
            newAggregate
        )
    }
}

export default ElementReplacement