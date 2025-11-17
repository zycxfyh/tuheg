// Mock for Langfuse SDK
export const Langfuse = jest.fn().mockImplementation(() => ({
  trace: jest.fn().mockReturnValue({
    generation: jest.fn().mockReturnValue({
      end: jest.fn(),
    }),
    end: jest.fn(),
  }),
  generation: jest.fn().mockReturnValue({
    end: jest.fn(),
  }),
  score: jest.fn(),
  shutdownAsync: jest.fn().mockResolvedValue(undefined),
}))

export default Langfuse