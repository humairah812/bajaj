const NODE_PATTERN = /^([A-Z])->([A-Z])$/;

function normalizeEdge(input) {
  if (typeof input !== "string") {
    return { valid: false, reason: "not-string", normalized: String(input) };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, reason: "empty", normalized: trimmed };
  }

  const match = trimmed.match(NODE_PATTERN);
  if (!match) {
    return { valid: false, reason: "format", normalized: trimmed };
  }

  const [, parent, child] = match;
  if (parent === child) {
    return { valid: false, reason: "self-loop", normalized: trimmed };
  }

  return {
    valid: true,
    normalized: `${parent}->${child}`,
    parent,
    child,
  };
}

function sortNodesLex(a, b) {
  return a.localeCompare(b);
}

function buildTreeObject(root, adjacency) {
  const walk = (node) => {
    const children = [...(adjacency.get(node) || [])].sort(sortNodesLex);
    const result = {};
    for (const child of children) {
      result[child] = walk(child);
    }
    return result;
  };

  return { [root]: walk(root) };
}

function getDepth(root, adjacency) {
  const dfs = (node) => {
    const children = adjacency.get(node) || new Set();
    if (children.size === 0) {
      return 1;
    }

    let best = 0;
    for (const child of children) {
      best = Math.max(best, dfs(child));
    }

    return best + 1;
  };

  return dfs(root);
}

function isCyclicComponent(nodes, adjacency) {
  const visitState = new Map();
  // 0: unvisited, 1: visiting, 2: done
  for (const node of nodes) {
    visitState.set(node, 0);
  }

  const dfs = (node) => {
    visitState.set(node, 1);
    const children = adjacency.get(node) || new Set();
    for (const child of children) {
      if (!visitState.has(child)) {
        continue;
      }
      const state = visitState.get(child);
      if (state === 1) {
        return true;
      }
      if (state === 0 && dfs(child)) {
        return true;
      }
    }
    visitState.set(node, 2);
    return false;
  };

  for (const node of nodes) {
    if (visitState.get(node) === 0 && dfs(node)) {
      return true;
    }
  }
  return false;
}

function buildUndirectedAdjacency(nodes, edges) {
  const undirected = new Map();
  for (const node of nodes) {
    undirected.set(node, new Set());
  }
  for (const { parent, child } of edges) {
    undirected.get(parent).add(child);
    undirected.get(child).add(parent);
  }
  return undirected;
}

function getConnectedComponents(nodes, edges) {
  const undirected = buildUndirectedAdjacency(nodes, edges);
  const seen = new Set();
  const components = [];

  for (const node of [...nodes].sort(sortNodesLex)) {
    if (seen.has(node)) continue;
    const queue = [node];
    seen.add(node);
    const comp = [];

    while (queue.length) {
      const curr = queue.shift();
      comp.push(curr);
      for (const nei of undirected.get(curr) || []) {
        if (!seen.has(nei)) {
          seen.add(nei);
          queue.push(nei);
        }
      }
    }
    components.push(comp.sort(sortNodesLex));
  }

  return components;
}

function processHierarchyInput(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const parentByChild = new Map();
  const seenPairs = new Set();
  const acceptedEdges = [];
  const allNodes = new Set();

  if (!Array.isArray(data)) {
    return {
      hierarchies: [],
      invalid_entries: ["Request body must contain data as an array"],
      duplicate_edges: [],
      summary: {
        total_trees: 0,
        total_cycles: 0,
        largest_tree_root: "",
      },
    };
  }

  for (const raw of data) {
    const parsed = normalizeEdge(raw);
    if (!parsed.valid) {
      invalid_entries.push(typeof raw === "string" ? raw.trim() : String(raw));
      continue;
    }

    const key = parsed.normalized;
    if (seenPairs.has(key)) {
      duplicate_edges.push(key);
      continue;
    }
    seenPairs.add(key);

    if (parentByChild.has(parsed.child)) {
      // Multi-parent rule: first parent wins, silently discard later edges.
      continue;
    }

    parentByChild.set(parsed.child, parsed.parent);
    acceptedEdges.push(parsed);
    allNodes.add(parsed.parent);
    allNodes.add(parsed.child);
  }

  const adjacency = new Map();
  for (const node of allNodes) {
    adjacency.set(node, new Set());
  }
  for (const { parent, child } of acceptedEdges) {
    adjacency.get(parent).add(child);
  }

  const components = getConnectedComponents(allNodes, acceptedEdges);
  const hierarchies = [];

  let totalTrees = 0;
  let totalCycles = 0;
  let bestDepth = -1;
  let largest_tree_root = "";

  for (const compNodes of components) {
    const nodeSet = new Set(compNodes);
    const indegree = new Map(compNodes.map((n) => [n, 0]));
    for (const node of compNodes) {
      for (const child of adjacency.get(node) || []) {
        if (nodeSet.has(child)) {
          indegree.set(child, indegree.get(child) + 1);
        }
      }
    }

    const roots = compNodes.filter((n) => indegree.get(n) === 0).sort(sortNodesLex);
    const chosenRoot = roots.length ? roots[0] : [...compNodes].sort(sortNodesLex)[0];
    const cyclic = isCyclicComponent(nodeSet, adjacency);

    if (cyclic) {
      totalCycles += 1;
      hierarchies.push({
        root: chosenRoot,
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    const tree = buildTreeObject(chosenRoot, adjacency);
    const depth = getDepth(chosenRoot, adjacency);
    totalTrees += 1;
    if (depth > bestDepth || (depth === bestDepth && chosenRoot < largest_tree_root)) {
      bestDepth = depth;
      largest_tree_root = chosenRoot;
    }

    hierarchies.push({
      root: chosenRoot,
      tree,
      depth,
    });
  }

  return {
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root,
    },
  };
}

module.exports = {
  processHierarchyInput,
};
