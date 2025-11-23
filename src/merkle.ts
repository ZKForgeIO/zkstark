// src/merkle.ts
/**
 * Merkle Tree Implementation for zkSTARK-style protocols
 *
 * Merkle trees provide efficient cryptographic commitments to data,
 * allowing proofs of inclusion without revealing all data.
 */

import { sha256 } from '@noble/hashes/sha256';

export class MerkleTree {
  leaves: Uint8Array[];
  layers: Uint8Array[][];
  root: Uint8Array;

  constructor(leaves: Uint8Array[]) {
    if (leaves.length === 0) {
      throw new Error('Merkle tree must have at least one leaf');
    }

    this.leaves = leaves;
    this.layers = [leaves];
    this.root = this.buildTree();
  }

  private buildTree(): Uint8Array {
    let currentLayer = this.leaves;

    while (currentLayer.length > 1) {
      const nextLayer: Uint8Array[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          const combined = new Uint8Array([
            ...currentLayer[i],
            ...currentLayer[i + 1]
          ]);
          nextLayer.push(sha256(combined));
        } else {
          nextLayer.push(currentLayer[i]);
        }
      }

      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    return currentLayer[0];
  }

  getRoot(): Uint8Array {
    return this.root;
  }

  getProof(index: number): MerkleProof {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error('Invalid leaf index');
    }

    const proof: { hash: Uint8Array; position: 'left' | 'right' }[] = [];
    let currentIndex = index;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push({
          hash: layer[siblingIndex],
          position: isRightNode ? 'left' : 'right'
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return new MerkleProof(this.leaves[index], proof, this.root);
  }

  verify(proof: MerkleProof): boolean {
    return proof.verify();
  }

  static hashLeaf(data: string | Uint8Array): Uint8Array {
    if (typeof data === 'string') {
      return sha256(new TextEncoder().encode(data));
    }
    return sha256(data);
  }
}

export class MerkleProof {
  leaf: Uint8Array;
  proof: { hash: Uint8Array; position: 'left' | 'right' }[];
  root: Uint8Array;

  constructor(
    leaf: Uint8Array,
    proof: { hash: Uint8Array; position: 'left' | 'right' }[],
    root: Uint8Array
  ) {
    this.leaf = leaf;
    this.proof = proof;
    this.root = root;
  }

  verify(): boolean {
    let currentHash = this.leaf;

    for (const { hash, position } of this.proof) {
      if (position === 'left') {
        const combined = new Uint8Array([...hash, ...currentHash]);
        currentHash = sha256(combined);
      } else {
        const combined = new Uint8Array([...currentHash, ...hash]);
        currentHash = sha256(combined);
      }
    }

    return arraysEqual(currentHash, this.root);
  }

  getRoot(): Uint8Array {
    return this.root;
  }
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
