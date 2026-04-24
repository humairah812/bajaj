const assert = require("assert");
const { processHierarchyInput } = require("../src/processor");

function testCoreSample() {
  const input = [
    "A->B",
    "A->C",
    "B->D",
    "C->E",
    "E->F",
    "X->Y",
    "Y->Z",
    "Z->X",
    "P->Q",
    "Q->R",
    "G->H",
    "G->H",
    "G->I",
    "hello",
    "1->2",
    "A->",
  ];

  const output = processHierarchyInput(input);
  assert.equal(output.summary.total_trees, 3);
  assert.equal(output.summary.total_cycles, 1);
  assert.equal(output.summary.largest_tree_root, "A");
  assert.deepEqual(output.duplicate_edges, ["G->H"]);
  assert(output.invalid_entries.includes("hello"));
  assert(output.invalid_entries.includes("1->2"));
  assert(output.invalid_entries.includes("A->"));
}

function testMultiParentRule() {
  const output = processHierarchyInput(["A->D", "B->D", "A->B"]);
  assert.equal(output.summary.total_trees, 1);
  const root = output.hierarchies[0].root;
  assert.equal(root, "A");
}

function testTrimAndSelfLoop() {
  const output = processHierarchyInput(["  A->B ", "A->A", ""]);
  assert.equal(output.summary.total_trees, 1);
  assert.equal(output.invalid_entries.length, 2);
}

function run() {
  testCoreSample();
  testMultiParentRule();
  testTrimAndSelfLoop();
  console.log("All tests passed.");
}

run();
