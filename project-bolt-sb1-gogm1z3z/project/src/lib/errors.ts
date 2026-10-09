export function getAuthErrorMessage(error: { message?: string } | unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Invalid login credentials')) return 'Invalid email or password. Please try again.';
  if (message.includes('User already registered')) return 'An account with this email already exists. Please log in instead.';
  if (message.includes('Password should be at least')) return 'Password must be at least 6 characters long.';
  if (message.includes('Unable to send email')) return 'Unable to send password reset email. Please check the email address and try again.';
  if (message.includes('Email not confirmed')) return 'Please confirm your email address before logging in.';
  if (message.includes('not authorized to change user role')) return 'You are not authorized to perform this action.';
  if (message.includes('row-level security')) return 'You do not have permission to perform this action.';
  if (message.includes('duplicate key value violates unique constraint')) {
    if (message.includes('employee_id')) return 'An employee with this ID already exists.';
    if (message.includes('license_number')) return 'A doctor with this license number already exists.';
    return 'A record with this value already exists.';
  }
  if (message.includes('violates unique constraint') && message.includes('no_double_booking')) return 'This time slot is already booked. Please choose a different time.';
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) return 'Unable to connect to the server. Please check your internet connection and try again.';
  if (message.includes('JWT expired') || message.includes('session_not_found')) return 'Your session has expired. Please log in again.';

  return message || 'An unexpected error occurred. Please try again.';
}
