// src/polynomial.ts
/**
 * Polynomial Operations for zkSTARK
 *
 * Implements polynomial arithmetic over finite fields, which is essential
 * for generic zkSTARK proof generation and verification.
 */

import { FieldElement } from './field';

export class Polynomial {
  coefficients: FieldElement[];
  modulus: bigint;

  constructor(coefficients: FieldElement[]) {
    if (coefficients.length === 0) {
      throw new Error('Polynomial must have at least one coefficient');
    }

    this.modulus = coefficients[0].modulus;

    for (const coef of coefficients) {
      if (coef.modulus !== this.modulus) {
        throw new Error('All coefficients must be from the same field');
      }
    }

    this.coefficients = this.trimLeadingZeros(coefficients);
  }

  private trimLeadingZeros(coeffs: FieldElement[]): FieldElement[] {
    let i = coeffs.length - 1;
    while (i > 0 && coeffs[i].isZero()) {
      i--;
    }
    return coeffs.slice(0, i + 1);
  }

  degree(): number {
    return this.coefficients.length - 1;
  }

  evaluate(x: FieldElement): FieldElement {
    if (x.modulus !== this.modulus) {
      throw new Error('Point must be from the same field');
    }

    let result = FieldElement.zero(this.modulus);
    let xPower = FieldElement.one(this.modulus);

    for (const coef of this.coefficients) {
      result = result.add(coef.mul(xPower));
      xPower = xPower.mul(x);
    }

    return result;
  }

  add(other: Polynomial): Polynomial {
    this.ensureSameField(other);

    const maxLen = Math.max(this.coefficients.length, other.coefficients.length);
    const result: FieldElement[] = [];

    for (let i = 0; i < maxLen; i++) {
      const a = i < this.coefficients.length ? this.coefficients[i] : FieldElement.zero(this.modulus);
      const b = i < other.coefficients.length ? other.coefficients[i] : FieldElement.zero(this.modulus);
      result.push(a.add(b));
    }

    return new Polynomial(result);
  }

  sub(other: Polynomial): Polynomial {
    this.ensureSameField(other);

    const maxLen = Math.max(this.coefficients.length, other.coefficients.length);
    const result: FieldElement[] = [];

    for (let i = 0; i < maxLen; i++) {
      const a = i < this.coefficients.length ? this.coefficients[i] : FieldElement.zero(this.modulus);
      const b = i < other.coefficients.length ? other.coefficients[i] : FieldElement.zero(this.modulus);
      result.push(a.sub(b));
    }

    return new Polynomial(result);
  }

  mul(other: Polynomial): Polynomial {
    this.ensureSameField(other);

    const resultLen = this.coefficients.length + other.coefficients.length - 1;
    const result: FieldElement[] = new Array(resultLen)
      .fill(null)
      .map(() => FieldElement.zero(this.modulus));

    for (let i = 0; i < this.coefficients.length; i++) {
      for (let j = 0; j < other.coefficients.length; j++) {
        result[i + j] = result[i + j].add(this.coefficients[i].mul(other.coefficients[j]));
      }
    }

    return new Polynomial(result);
  }

  scalarMul(scalar: FieldElement): Polynomial {
    if (scalar.modulus !== this.modulus) {
      throw new Error('Scalar must be from the same field');
    }

    const result = this.coefficients.map((coef) => coef.mul(scalar));
    return new Polynomial(result);
  }

  leadingCoefficient(): FieldElement {
    return this.coefficients[this.coefficients.length - 1];
  }

  isZero(): boolean {
    return this.coefficients.length === 1 && this.coefficients[0].isZero();
  }

  static zero(modulus: bigint): Polynomial {
    return new Polynomial([FieldElement.zero(modulus)]);
  }

  static one(modulus: bigint): Polynomial {
    return new Polynomial([FieldElement.one(modulus)]);
  }

  static interpolate(points: [FieldElement, FieldElement][]): Polynomial {
    if (points.length === 0) {
      throw new Error('Need at least one point for interpolation');
    }

    const modulus = points[0][0].modulus;
    let result = Polynomial.zero(modulus);

    for (let i = 0; i < points.length; i++) {
      let term = new Polynomial([points[i][1]]);

      for (let j = 0; j < points.length; j++) {
        if (i !== j) {
          const numerator = new Polynomial([
            points[j][0].neg(),
            FieldElement.one(modulus)
          ]);
          const denominator = points[i][0].sub(points[j][0]);
          term = term.mul(numerator).scalarMul(denominator.inverse());
        }
      }

      result = result.add(term);
    }

    return result;
  }

  toString(): string {
    return (
      this.coefficients
        .map((c, i) => {
          if (c.isZero()) return '';
          const coefStr = c.value === 1n && i > 0 ? '' : c.toString();
          const varStr = i === 0 ? '' : i === 1 ? 'x' : `x^${i}`;
          return `${coefStr}${varStr}`;
        })
        .filter((s) => s)
        .join(' + ') || '0'
    );
  }

  private ensureSameField(other: Polynomial) {
    if (this.modulus !== other.modulus) {
      throw new Error('Polynomials must be over the same field');
    }
  }
}
