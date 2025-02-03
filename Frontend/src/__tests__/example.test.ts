import '@testing-library/jest-dom'

describe('Example Test Suite', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true)
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success')
    const result = await promise
    expect(result).toBe('success')
  })
}) 