import { randomUUID } from 'node:crypto';
import { UserModel } from './user.model';
import { HttpError } from '../../shared/middlewares/error-handler';
import { encrypt, decrypt } from '../../shared/utils/encryption';
import { logger } from '../../shared/config/logger';
import { AuditLogModel } from '../audit-logs/audit-log.model';
import type { MedicationScheduleEntry } from '@medcheck/shared-types';

export async function getSchedule(userId: string): Promise<MedicationScheduleEntry[]> {
  const user = await UserModel.findById(userId);
  if (!user) throw new HttpError(404, 'Không tìm thấy người dùng');
  if (!user.medicationScheduleEncrypted) return [];
  try {
    return JSON.parse(decrypt(user.medicationScheduleEncrypted)) as MedicationScheduleEntry[];
  } catch (err) {
    logger.warn({ err, userId }, 'Failed to decrypt medicationSchedule — possible key rotation');
    throw new HttpError(500, 'Lịch uống thuốc không thể giải mã. Vui lòng liên hệ hỗ trợ.');
  }
}

async function writeSchedule(userId: string, schedule: MedicationScheduleEntry[]): Promise<void> {
  const encrypted = encrypt(JSON.stringify(schedule));
  await UserModel.findByIdAndUpdate(userId, { medicationScheduleEncrypted: encrypted });
}

/**
 * Thay thế toàn bộ schedule. Không nên dùng ngoài backend — route chỉ thêm/xoá.
 * Giữ lại cho test hoặc admin tooling.
 */
export async function setSchedule(userId: string, schedule: MedicationScheduleEntry[]): Promise<void> {
  await writeSchedule(userId, schedule);
}

export async function addToSchedule(
  userId: string,
  entry: Omit<MedicationScheduleEntry, 'id'>,
): Promise<MedicationScheduleEntry> {
  const schedule = await getSchedule(userId);
  const newEntry: MedicationScheduleEntry = { ...entry, id: randomUUID() };
  schedule.push(newEntry);
  await writeSchedule(userId, schedule);
  // Phần 7: audit log cho mọi thao tác dữ liệu sức khỏe.
  // Không ghi diff đầy đủ vì entry chứa thông tin liên quan sức khoẻ;
  // chỉ ghi drugId + dosage để tra soát.
  await AuditLogModel.create({
    entityType: 'schedule',
    entityId: newEntry.id,
    action: 'add',
    performedBy: userId,
    diff: { drugId: entry.drugId, dosage: entry.dosage, times: entry.times },
  });
  return newEntry;
}

export async function removeFromSchedule(userId: string, entryId: string): Promise<void> {
  const schedule = await getSchedule(userId);
  const removed = schedule.find((e) => e.id === entryId);
  const filtered = schedule.filter((e) => e.id !== entryId);
  if (filtered.length === schedule.length) {
    // không tìm thấy — không ghi log, không throw để tránh enumeration
    return;
  }
  await writeSchedule(userId, filtered);
  await AuditLogModel.create({
    entityType: 'schedule',
    entityId: entryId,
    action: 'remove',
    performedBy: userId,
    diff: { drugId: removed?.drugId ?? null },
  });
}
