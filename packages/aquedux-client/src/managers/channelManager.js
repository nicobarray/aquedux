// @flow

type ReduceSnapshotFn = (prevState: Object, snapshot: Object) => Object

type Sub = {
  name: string,
  id?: string,
  template: boolean
}

type State = {
  definitions: { [string]: ReduceSnapshotFn },
  subscription: Array<Sub>
}

let innerState: State = {
  definitions: {},
  subscription: []
}

export default {
  define: (name: string, reducer: ReduceSnapshotFn): void => {
    innerState.definitions[name] = reducer
  },
  reduce: (name: string) => (prevState: Object, snapshot: Object) => {
    return innerState.definitions[name](prevState, snapshot)
  },
  addSub: (sub: Sub): void => {
    innerState.subscription.push(sub)
  },
  delSub: (name: string): void => {
    innerState.subscription = innerState.subscription.filter(sub => sub.name !== name)
  },
  hasSub: (sub: Sub): boolean =>
    !!innerState.subscription.find(ownSub => {
      const { name, id, template } = sub
      return ownSub.name === name && ownSub.id === id && ownSub.template === template
    }),
  getSub: () => innerState.subscription,
  hasDef: (name: string): boolean => innerState.definitions.hasOwnProperty(name)
}
