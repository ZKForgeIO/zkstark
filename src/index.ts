// src/index.ts
/**
 * ZKForge zkSTARK Auth Library
 *
 * A TypeScript implementation of a zkSTARK-style (transparent, hash-based)
 * argument of knowledge specialized for user authentication.
 *
 * @module zkstark
 */

export {
  FieldElement,
  STARK_PRIME,
  createField,
  authHash,
  fieldElementToBytes,
  fieldElementFromBytes
} from './field';

export { Polynomial } from './polynomial';
export { MerkleTree, MerkleProof } from './merkle';

export {
  Statement,
  Witness,
  Constraint,
  AuthParams,
  Proof,
  AuthOpening,
  StarkProver,
  buildAuthTrace,
  computeChallengeSeed,
  deriveQueryIndices,
  generateAuthProof
} from './prover';

export { StarkVerifier } from './verifier';

export const VERSION = '1.0.0';
