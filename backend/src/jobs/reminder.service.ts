import { logger } from '../shared/config/logger';
import { getUserProfile } from '../modules/users/auth.service';

// Stub implementation — theo spec Phần 6.3:
// Gửi Web Push / email nhắc nhở uống thuốc.
// Production: implement với Resend (email) + Web Push API.
export async function sendReminder(userId: string, entryId: string): Promise<void> {
  const user = await getUserProfile(userId);
  if (!user) {
    logger.warn({ userId, entryId }, 'User not found for reminder');
    return;
  }

  if (user.pushSubscription) {
    // TODO: implement Web Push notification
    logger.info({ userId, entryId }, 'Would send Web Push notification');
  } else {
    // TODO: implement email via Resend
    logger.info({ userId, entryId, email: user.email }, 'Would send email reminder');
  }
}
