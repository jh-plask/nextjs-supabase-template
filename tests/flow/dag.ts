/**
 * DAG Test Runner
 *
 * Minimal DAG implementation for test flow execution.
 */

import type { FlowContext } from "./context";

// ===========================================
// Node Types
// ===========================================

export type NodeStatus =
  | "pending"
  | "running"
  | "passed"
  | "failed"
  | "skipped";

export type Domain = "auth" | "org" | "invitations" | "projects" | "members";

export interface TestNode {
  id: string;
  name: string;
  domain: Domain;
  dependencies: string[];
  run: (ctx: FlowContext) => Promise<void>;
}

export interface DAGResult {
  passed: string[];
  failed: Array<{ id: string; error: Error }>;
  skipped: string[];
  duration: number;
}

// ===========================================
// DAG Runner
// ===========================================

export class TestDAG {
  private readonly nodes = new Map<string, TestNode>();
  private readonly status = new Map<string, NodeStatus>();
  private readonly errors = new Map<string, Error>();

  add(node: TestNode): this {
    this.nodes.set(node.id, node);
    this.status.set(node.id, "pending");
    return this;
  }

  addAll(nodes: TestNode[]): this {
    for (const node of nodes) {
      this.add(node);
    }
    return this;
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Topological sort
  private getLevels(): string[][] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    for (const id of this.nodes.keys()) {
      inDegree.set(id, 0);
      adjList.set(id, []);
    }

    for (const [id, node] of this.nodes) {
      for (const dep of node.dependencies) {
        if (!this.nodes.has(dep)) {
          throw new Error(`Node "${id}" depends on unknown node "${dep}"`);
        }
        adjList.get(dep)?.push(id);
        inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
      }
    }

    const levels: string[][] = [];
    const remaining = new Set(this.nodes.keys());

    while (remaining.size > 0) {
      const level: string[] = [];
      for (const id of remaining) {
        if (inDegree.get(id) === 0) {
          level.push(id);
        }
      }

      if (level.length === 0) {
        throw new Error("Cycle detected in DAG");
      }

      for (const id of level) {
        remaining.delete(id);
        for (const child of adjList.get(id) ?? []) {
          inDegree.set(child, (inDegree.get(child) ?? 0) - 1);
        }
      }

      levels.push(level);
    }

    return levels;
  }

  private canRun(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }
    return node.dependencies.every((dep) => this.status.get(dep) === "passed");
  }

  async execute(ctx: FlowContext): Promise<DAGResult> {
    const startTime = Date.now();
    const levels = this.getLevels();

    console.log("\n🔷 DAG Execution Plan:");
    for (let i = 0; i < levels.length; i++) {
      const names = levels[i]
        .map((id) => this.nodes.get(id)?.name ?? id)
        .join(", ");
      console.log(`  Level ${i}: [${names}]`);
    }

    for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
      const level = levels[levelIdx];
      console.log(`\n📍 Level ${levelIdx}:`);

      // Run nodes sequentially within each level (they share the same browser page)
      let levelFailures = 0;
      for (const nodeId of level) {
        const node = this.nodes.get(nodeId);
        if (!node) {
          continue;
        }

        if (!this.canRun(nodeId)) {
          console.log(`  ⏭️  ${node.name} (skipped)`);
          this.status.set(nodeId, "skipped");
          continue;
        }

        this.status.set(nodeId, "running");
        console.log(`  ▶️  ${node.name}...`);

        try {
          await node.run(ctx);
          this.status.set(nodeId, "passed");
          console.log(`  ✅ ${node.name}`);
        } catch (err) {
          this.status.set(nodeId, "failed");
          this.errors.set(nodeId, err as Error);
          console.log(`  ❌ ${node.name}: ${(err as Error).message}`);
          levelFailures++;
        }
      }

      const failures = { length: levelFailures };
      if (failures.length > 0) {
        console.log(
          `\n⚠️  ${failures.length} test(s) failed at level ${levelIdx}`
        );
      }
    }

    const passed: string[] = [];
    const failed: Array<{ id: string; error: Error }> = [];
    const skipped: string[] = [];

    for (const [nodeId, nodeStatus] of this.status) {
      if (nodeStatus === "passed") {
        passed.push(nodeId);
      } else if (nodeStatus === "failed") {
        const error = this.errors.get(nodeId);
        if (error) {
          failed.push({ id: nodeId, error });
        }
      } else if (nodeStatus === "skipped") {
        skipped.push(nodeId);
      }
    }

    return { passed, failed, skipped, duration: Date.now() - startTime };
  }

  visualize(): string {
    const lines = ["DAG Structure:", ""];
    const byDomain = new Map<string, TestNode[]>();

    for (const [, node] of this.nodes) {
      const list = byDomain.get(node.domain) ?? [];
      list.push(node);
      byDomain.set(node.domain, list);
    }

    for (const [domain, nodes] of byDomain) {
      lines.push(`  [${domain}]`);
      for (const node of nodes) {
        const deps =
          node.dependencies.length > 0
            ? ` ← [${node.dependencies.join(", ")}]`
            : " (root)";
        lines.push(`    ${node.name}${deps}`);
      }
    }
    return lines.join("\n");
  }
}

// Re-export context
export * from "./context";
