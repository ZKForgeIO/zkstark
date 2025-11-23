# ZKForge zkSTARK - Quick Start Guide

Get up and running with zkSTARK proofs in 5 minutes!

## Installation

```bash
npm install @zkforge/zkstark
```

## Basic Usage

### 1. Import the Library

```typescript
import {
  FieldElement,
  STARK_PRIME,
  StarkProver,
  StarkVerifier,
  Statement,
  Witness
} from '@zkforge/zkstark';
```

### 2. Create Your Computation

Define what you want to prove:

```typescript
// Example: Prove you know a value that squares to 16
const secretValue = 4n;

// Create trace (execution steps)
const trace = [
  new FieldElement(secretValue, STARK_PRIME),
  new FieldElement(secretValue * secretValue, STARK_PRIME)
];
```

### 3. Define Constraints

Constraints enforce computational correctness:

```typescript
const squareConstraint = {
  evaluate: (trace: FieldElement[]) => {
    // Constraint: trace[1] should equal trace[0]^2
    const expected = trace[0].mul(trace[0]);
    return trace[1].sub(expected);
  }
};
```

### 4. Prepare Statement and Witness

```typescript
const statement: Statement = {
  publicInput: [trace[1]], // Only reveal result (16)
  constraints: [squareConstraint]
};

const witness: Witness = {
  privateInput: [trace[0]], // Keep secret (4)
  trace: trace
};
```

### 5. Generate Proof

```typescript
const prover = new StarkProver(statement, witness);
const proof = prover.generateProof();

console.log('✓ Proof generated!');
```

### 6. Verify Proof

```typescript
const verifier = new StarkVerifier(statement);
const isValid = verifier.verify(proof);

console.log(`Proof is ${isValid ? 'VALID ✓' : 'INVALID ✗'}`);
```

## Complete Example

Here's a full working example:

```typescript
import {
  FieldElement,
  STARK_PRIME,
  StarkProver,
  StarkVerifier
} from '@zkforge/zkstark';

// Secret value (verifier doesn't know this)
const secret = 42n;

// Create trace
const trace = [
  new FieldElement(secret, STARK_PRIME),
  new FieldElement(secret * secret, STARK_PRIME)
];

// Define constraint
const constraint = {
  evaluate: (t: FieldElement[]) => t[1].sub(t[0].mul(t[0]))
};

// Setup
const statement = {
  publicInput: [trace[1]],
  constraints: [constraint]
};

const witness = {
  privateInput: [trace[0]],
  trace: trace
};

// Prove
const prover = new StarkProver(statement, witness);
const proof = prover.generateProof();

// Verify
const verifier = new StarkVerifier(statement);
const isValid = verifier.verify(proof);

console.log(`Proved knowledge of square root: ${isValid}`);
```

## Run Examples

Try the included examples:

```bash
# Fibonacci sequence proof
npm run example:fibonacci

# Range proof (value in range without revealing it)
npm run example:range-proof
```

## Common Use Cases

### Privacy-Preserving Authentication

```typescript
// Prove you know a password without revealing it
const passwordHash = sha256(password);
// Generate proof that you know preimage of hash
```

### Confidential Transactions

```typescript
// Prove transaction is valid without revealing amounts
// Constraint: input_amount = output_amount + fee
```

### Age Verification

```typescript
// Prove age > 18 without revealing exact age
// Constraint: current_year - birth_year >= 18
```

## Next Steps

1. Read the [full README](README.md) for detailed API reference
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for technical deep-dive
3. Browse [examples/](examples/) for more use cases
4. See [tests/](tests/) for comprehensive test suite

## Need Help?

- **Documentation**: [Full API Reference](README.md)
- **Examples**: [examples/](examples/)
- **Issues**: [GitHub Issues](https://github.com/zkforge/zkstark/issues)
- **Discord**: [Join Community](https://discord.gg/zkforge)

Happy proving! 🔐✨
