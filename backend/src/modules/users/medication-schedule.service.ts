import { UserModel } from './user.model';
import { HttpError } from '../../shared/middlewares/error-handler';
import { encrypt, decrypt } from '../../shared/utils/encryption';
import type { MedicationScheduleEntry } from '@medcheck/shared-types';

export async function getSchedule(userId: string): Promise<MedicationScheduleEntry[]> {
  const user = await UserModel.findById(userId);
  if (!user) throw new HttpError(404, 'Không tìm thấy người dùng');
  if (!user.medicationScheduleEncrypted) return [];
  try {
    return JSON.parse(decrypt(user.medicationScheduleEncrypted)) as MedicationScheduleEntry[];
  } catch {
    return [];
  }
}

export async function setSchedule(userId: string, schedule: MedicationScheduleEntry[]): Promise<void> {
  const encrypted = encrypt(JSON.stringify(schedule));
  await UserModel.findByIdAndUpdate(userId, { medicationScheduleEncrypted: encrypted });
}

export async function addToSchedule(userId: string, entry: Omit<MedicationScheduleEntry, 'id'>): Promise<MedicationScheduleEntry> {
  const schedule = await getSchedule(userId);
  const newEntry: MedicationScheduleEntry = { ...entry, id: crypto.randomUUID() };
  schedule.push(newEntry);
  await setSchedule(userId, schedule);
  return newEntry;
}

export async function removeFromSchedule(userId: string, entryId: string): Promise<void> {
  const schedule = await getSchedule(userId);
  const filtered = schedule.filter((e) => e.id !== entryId);
  await setSchedule(userId, filtered);
}
