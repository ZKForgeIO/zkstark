// src/verifier.ts
/**
 * zkSTARK-style Auth Verifier
 *
 * Verifies proofs that a secret hash chain of length `steps`
 * ends in a known public value `finalHash`, without learning
 * the secret itself.
 */

import { FieldElement, authHash } from './field';
import { MerkleProof } from './merkle';
import {
  Statement,
  Proof,
  AuthParams,
  computeChallengeSeed,
  deriveQueryIndices
} from './prover';

export class StarkVerifier {
  statement: Statement;
  params: AuthParams;

  constructor(statement: Statement, params: AuthParams) {
    this.statement = statement;
    this.params = params;
  }

  verify(proof: Proof): boolean {
    try {
      const { steps, queries } = this.params;

      if (steps < 2 || queries < 1) {
        return false;
      }
      if (proof.indices.length !== queries) {
        return false;
      }
      if (proof.openings.length !== queries) {
        return false;
      }

      // Recompute Fiat–Shamir challenge and expected indices
      const seed = computeChallengeSeed(proof.root, this.statement);
      const expectedIndices = deriveQueryIndices(seed, this.params);

      if (!arrayEqualNumbers(expectedIndices, proof.indices)) {
        // Indices were tampered with
        return false;
      }

      let finalEdgeChecked = false;

      for (let i = 0; i < proof.indices.length; i++) {
        const index = proof.indices[i];
        const opening = proof.openings[i];

        if (opening.index !== index) {
          return false;
        }

        if (index < 0 || index >= steps - 1) {
          // need t[i] and t[i+1]
          return false;
        }

        const { current, next, proofCurrent, proofNext } = opening;

        // Sanity: Merkle proofs should be tied to the same root
        if (
          !arraysEqual(proofCurrent.root, proof.root) ||
          !arraysEqual(proofNext.root, proof.root)
        ) {
          return false;
        }

        // Check Merkle path validity
        if (!proofCurrent.verify()) return false;
        if (!proofNext.verify()) return false;

        // Check transition constraint: t[i+1] = H(t[i])
        const expectedNext: FieldElement = authHash(current);
        if (!expectedNext.equals(next)) {
          return false;
        }

        // If this is the last transition, check finalHash
        if (index === steps - 2) {
          if (!next.equals(this.statement.finalHash)) {
            return false;
          }
          finalEdgeChecked = true;
        }
      }

      if (!finalEdgeChecked) {
        // By design, deriveQueryIndices always includes steps-2,
        // so if we didn't see it, something is wrong.
        return false;
      }

      return true;
    } catch (err) {
      // Any error means verification failed
      return false;
    }
  }

  /**
   * Optional helpers, similar shape to old API.
   */

  getProofSize(proof: Proof): number {
    let size = 0;
    size += proof.root.length;
    size += proof.indices.length * 4;
    for (const opening of proof.openings) {
      // current + next field elements (32 bytes each)
      size += 64;
      size += serializedMerkleProofSize(opening.proofCurrent);
      size += serializedMerkleProofSize(opening.proofNext);
    }
    return size;
  }

  getVerificationComplexity(proof: Proof): string {
    const numQueries = proof.indices.length;
    // complexity is dominated by Merkle path verifications
    return `O(${numQueries} * log(traceLength))`;
  }
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function arrayEqualNumbers(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function serializedMerkleProofSize(mp: MerkleProof): number {
  // Rough estimate: each node is 32 bytes + 1 byte position
  // depth ~ log2(#leaves), but we don't know leaves count here.
  // Just approximate by proof length * 33.
  return mp.proof.length * 33;
}
