const generateReferralCode = require('../generateReferralCode');

describe('generateReferralCode', () => {
  test('should generate a string', () => {
    const code = generateReferralCode();
    expect(typeof code).toBe('string');
  });

  test('should generate a code with length 8', () => {
    const code = generateReferralCode();
    expect(code.length).toBe(8);
  });

  test('should generate uppercase alphanumeric characters', () => {
    const code = generateReferralCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  test('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateReferralCode());
    }
    // If all codes are unique, the size of the Set should be 100
    expect(codes.size).toBe(100);
  });
});
