// src/field.ts
/**
 * Finite Field Arithmetic for zkSTARK-style protocols
 *
 * Implements arithmetic operations over a prime field F_p.
 * This is the foundation for all zkSTARK operations.
 */

export class FieldElement {
  value: bigint;
  modulus: bigint;

  constructor(value: bigint, modulus: bigint) {
    this.modulus = modulus;
    this.value = this.mod(value);
  }

  private mod(n: bigint): bigint {
    const result = n % this.modulus;
    return result >= 0n ? result : result + this.modulus;
  }

  add(other: FieldElement): FieldElement {
    this.ensureSameField(other);
    return new FieldElement(this.value + other.value, this.modulus);
  }

  sub(other: FieldElement): FieldElement {
    this.ensureSameField(other);
    return new FieldElement(this.value - other.value, this.modulus);
  }

  mul(other: FieldElement): FieldElement {
    this.ensureSameField(other);
    return new FieldElement(this.value * other.value, this.modulus);
  }

  div(other: FieldElement): FieldElement {
    this.ensureSameField(other);
    return this.mul(other.inverse());
  }

  pow(exponent: bigint): FieldElement {
    if (exponent < 0n) {
      return this.inverse().pow(-exponent);
    }

    let result = new FieldElement(1n, this.modulus);
    let base: FieldElement = this;   // <-- explicit type fixes TS
    let exp = exponent;

    while (exp > 0n) {
      if (exp % 2n === 1n) {
        result = result.mul(base);
      }
      base = base.mul(base);
      exp = exp / 2n;
    }

    return result;
  }


  inverse(): FieldElement {
    if (this.value === 0n) {
      throw new Error('Cannot invert zero');
    }

    const [gcd, x] = this.extendedGcd(this.value, this.modulus);

    if (gcd !== 1n) {
      throw new Error('Element is not invertible');
    }

    return new FieldElement(x, this.modulus);
  }

  private extendedGcd(a: bigint, b: bigint): [bigint, bigint] {
    if (b === 0n) {
      return [a, 1n];
    }

    let [oldR, r] = [a, b];
    let [oldS, s] = [1n, 0n];

    while (r !== 0n) {
      const quotient = oldR / r;
      [oldR, r] = [r, oldR - quotient * r];
      [oldS, s] = [s, oldS - quotient * s];
    }

    return [oldR, oldS];
  }

  neg(): FieldElement {
    return new FieldElement(-this.value, this.modulus);
  }

  equals(other: FieldElement): boolean {
    return this.value === other.value && this.modulus === other.modulus;
  }

  isZero(): boolean {
    return this.value === 0n;
  }

  toString(): string {
    return this.value.toString();
  }

  private ensureSameField(other: FieldElement) {
    if (this.modulus !== other.modulus) {
      throw new Error('Field mismatch');
    }
  }

  static zero(modulus: bigint): FieldElement {
    return new FieldElement(0n, modulus);
  }

  static one(modulus: bigint): FieldElement {
    return new FieldElement(1n, modulus);
  }
}

/**
 * Standard prime field for zkSTARK-style constructions.
 * 251-bit prime used in many STARK designs.
 */
export const STARK_PRIME = 2n ** 251n + 17n * 2n ** 192n + 1n;

/**
 * Helper to create a field element in F_p from various inputs.
 */
export function createField(value: bigint | number | string): FieldElement {
  let v: bigint;
  if (typeof value === 'bigint') {
    v = value;
  } else if (typeof value === 'number') {
    v = BigInt(value);
  } else {
    // string: decimal or 0x-prefixed
    v = BigInt(value);
  }
  return new FieldElement(v, STARK_PRIME);
}

/**
 * Toy hash function inside the field.
 * H(x) = x^3 + 7 (mod p)
 *
 * NOTE: This is NOT a cryptographic hash. It is a simple
 * algebraic transition used to build a STARK-style example
 * for authentication.
 */
export function authHash(x: FieldElement): FieldElement {
  const c7 = new FieldElement(7n, x.modulus);
  return x.pow(3n).add(c7);
}

/**
 * Encode a field element as 32 bytes (big-endian).
 */
export function fieldElementToBytes(fe: FieldElement): Uint8Array {
  const hex = fe.value.toString(16).padStart(64, '0'); // 32 bytes
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Decode a 32-byte (big-endian) array into a field element in F_p.
 */
export function fieldElementFromBytes(bytes: Uint8Array): FieldElement {
  if (bytes.length !== 32) {
    throw new Error('Expected 32 bytes for field element');
  }
  let v = 0n;
  for (const b of bytes) {
    v = (v << 8n) | BigInt(b);
  }
  return new FieldElement(v, STARK_PRIME);
}
