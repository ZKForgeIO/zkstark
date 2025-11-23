// src/prover.ts
/**
 * zkSTARK-style Auth Prover
 *
 * We prove knowledge of a secret s such that a public value Y is obtained
 * by iterating a field hash H for `steps` rounds:
 *
 *   t[0]   = H(s)
 *   t[i+1] = H(t[i])   for i = 0..steps-2
 *   Y      = t[steps-1]
 *
 * The prover commits to the full trace with a Merkle tree and uses
 * a Fiat–Shamir challenge to open random positions. This is a
 * STARK-style (transparent, hash-based) argument specialized
 * for authentication.
 */

import { sha256 } from '@noble/hashes/sha256';
import {
  FieldElement,
  authHash,
  fieldElementToBytes
} from './field';
import { MerkleTree, MerkleProof } from './merkle';

/**
 * Public statement for authentication.
 * `finalHash` is what the backend stores / knows as the user's commitment.
 */
export interface Statement {
  steps: number;             // length of the hash chain (>=2)
  finalHash: FieldElement;   // t[steps-1]
}

/**
 * Secret witness: the user's secret value.
 */
export interface Witness {
  secret: FieldElement;
}

/**
 * Optional placeholder for future generic constraints.
 * Kept for API compatibility with earlier versions.
 */
export interface Constraint {}

/**
 * Parameters for the auth proof.
 *
 * - steps: number of hash iterations in the chain
 * - queries: how many random positions are opened
 */
export interface AuthParams {
  steps: number;
  queries: number;
}

/**
 * Single opening in the auth proof.
 */
export interface AuthOpening {
  index: number;          // i (we open t[i] and t[i+1])
  current: FieldElement;  // t[i]
  next: FieldElement;     // t[i+1]
  proofCurrent: MerkleProof;
  proofNext: MerkleProof;
}

/**
 * Complete auth proof object.
 */
export interface Proof {
  root: Uint8Array;       // Merkle root of the entire trace
  indices: number[];      // challenged indices
  openings: AuthOpening[]; // openings for each index
}

/**
 * Build the full hash chain trace t[0..steps-1] from the secret.
 */
export function buildAuthTrace(
  witness: Witness,
  params: AuthParams
): FieldElement[] {
  const { steps } = params;
  if (steps < 2) {
    throw new Error('steps must be >= 2');
  }

  const trace: FieldElement[] = new Array(steps);
  trace[0] = authHash(witness.secret);
  for (let i = 1; i < steps; i++) {
    trace[i] = authHash(trace[i - 1]);
  }
  return trace;
}

/**
 * Compute the Fiat–Shamir seed from the Merkle root and public statement.
 */
export function computeChallengeSeed(root: Uint8Array, statement: Statement): Uint8Array {
  const finalBytes = fieldElementToBytes(statement.finalHash);
  const data = new Uint8Array(root.length + finalBytes.length);
  data.set(root, 0);
  data.set(finalBytes, root.length);
  return sha256(data);
}

/**
 * Deterministically derive query indices from a seed.
 *
 * We always include index `steps - 2` so that one query covers the
 * last transition t[steps-2] -> t[steps-1] = finalHash.
 */
export function deriveQueryIndices(
  seed: Uint8Array,
  params: AuthParams
): number[] {
  const { steps, queries } = params;
  if (queries < 1) {
    throw new Error('queries must be >= 1');
  }
  if (steps < 2) {
    throw new Error('steps must be >= 2');
  }
  if (queries > steps - 1) {
    throw new Error('queries must be <= steps - 1');
  }

  const indices: number[] = [];

  // Force last transition to be checked (steps-2 -> steps-1)
  const forcedIndex = steps - 2;
  indices.push(forcedIndex);

  let counter = 0;
  while (indices.length < queries) {
    const ctr = new Uint8Array(4);
    ctr[0] = (counter >>> 24) & 0xff;
    ctr[1] = (counter >>> 16) & 0xff;
    ctr[2] = (counter >>> 8) & 0xff;
    ctr[3] = counter & 0xff;

    const data = new Uint8Array(seed.length + ctr.length);
    data.set(seed, 0);
    data.set(ctr, seed.length);
    const h = sha256(data);

    let acc = 0n;
    // Use first 8 bytes to derive an index
    for (let i = 0; i < 8; i++) {
      acc = (acc << 8n) | BigInt(h[i]);
    }

    const idx = Number(acc % BigInt(steps - 1)); // indices in [0, steps-2]
    if (!indices.includes(idx)) {
      indices.push(idx);
    }

    counter++;
  }

  return indices;
}

/**
 * Main prover function, used by StarkProver class below.
 */
export function generateAuthProof(
  statement: Statement,
  witness: Witness,
  params: AuthParams
): Proof {
  const { steps, queries } = params;
  if (queries < 1) {
    throw new Error('queries must be >= 1');
  }
  if (queries > steps - 1) {
    throw new Error('queries must be <= steps - 1');
  }

  const trace = buildAuthTrace(witness, params);
  const finalValue = trace[steps - 1];
  if (!finalValue.equals(statement.finalHash)) {
    throw new Error('Witness does not match statement.finalHash');
  }

  // Commit to the whole trace using a Merkle tree
  const leaves = trace.map((e) => fieldElementToBytes(e));
  const tree = new MerkleTree(leaves);
  const root = tree.getRoot();

  // Fiat–Shamir challenge
  const seed = computeChallengeSeed(root, statement);
  const indices = deriveQueryIndices(seed, params);

  // Open the requested positions (t[i], t[i+1])
  const openings: AuthOpening[] = indices.map((index) => {
    const current = trace[index];
    const next = trace[index + 1];
    const proofCurrent = tree.getProof(index);
    const proofNext = tree.getProof(index + 1);
    return { index, current, next, proofCurrent, proofNext };
  });

  return { root, indices, openings };
}

/**
 * Convenience class API, similar to your original StarkProver.
 */
export class StarkProver {
  statement: Statement;
  witness: Witness;
  params: AuthParams;

  constructor(statement: Statement, witness: Witness, params: AuthParams) {
    this.statement = statement;
    this.witness = witness;
    this.params = params;
  }

  generateProof(): Proof {
    return generateAuthProof(this.statement, this.witness, this.params);
  }
}
