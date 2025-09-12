export function mockCore(overrides = {}) {
  return {
    setFailed: (msg) => console.error(msg),
    warning: (msg) => console.log(msg),
    ...overrides,
  };
}
