async function constantTimeDelay(minMs: number = 100): Promise<void> {
  const start = Date.now();
  const elapsed = Date.now() - start;

  if (elapsed < minMs) {
    await new Promise<void>((resolve) => setTimeout(resolve, minMs - elapsed));
  }
}

export { constantTimeDelay };
