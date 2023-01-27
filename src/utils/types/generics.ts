type RequiredNotNull<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

export type Ensure<T, K extends keyof T> = T & RequiredNotNull<Pick<T, K>>

export type Defined<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> &
  { [P in K]-?: Exclude<T[P], undefined> }
