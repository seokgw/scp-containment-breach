// Client-side memo recovery module
const fragments = ["f224e4c85}","SCP{3e9d","8c67f843d14"];
const order = [1, 2, 0];
function restoreMemo() { return order.map(i => fragments[i]).join(''); }
// Operator must inspect this source to recover the deleted memo.
