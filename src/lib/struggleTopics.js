(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function getAllRows() {
    if (typeof module === 'object' && module.exports) {
      return require('../data/struggleTopics.json');
    }
    return (typeof globalThis !== 'undefined' && globalThis.STRUGGLE_TOPICS) || [];
  }
  function struggleTopicsFor(grade) {
    const all = getAllRows();
    return all.filter(function (row) { return row.grade === grade; });
  }
  return {
    struggleTopicsFor: struggleTopicsFor,
  };
});
