/** Avoid showing raw Supabase “email rate limit” copy to users. */
export function sanitizeAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("email quota") ||
    lower.includes("429")
  ) {
    return "Please wait a minute and try again.";
  }
  return message;
}
