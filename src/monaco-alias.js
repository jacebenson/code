// Aliases the monaco-editor ESM entry point onto the AMD build the page already
// loads, so the collaboration bundle does not ship a second copy of Monaco.
//
// The binding touches monaco.Selection.createWithDirection, new monaco.Range,
// new monaco.Selection, and monaco.SelectionDirection. A get trap covers the
// statics, a construct trap covers the constructors, and both read the global
// lazily because Monaco loads after this module is evaluated.
const namespace = (name) =>
  new Proxy(function () {}, {
    get(_target, property) {
      const owner = window.monaco && window.monaco[name];
      const value = owner && owner[property];
      return typeof value === "function" ? value.bind(owner) : value;
    },
    construct(_target, args) {
      const owner = window.monaco && window.monaco[name];
      if (!owner) throw new Error(`Monaco is not ready yet, so ${name} is unavailable.`);
      return new owner(...args);
    },
  });

export const Selection = namespace("Selection");
export const Range = namespace("Range");
export const SelectionDirection = namespace("SelectionDirection");
