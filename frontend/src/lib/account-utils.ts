'use client';

import type { EmailAccount } from '@/types/email';
import { apiClient } from './api';

export function findExistingAccount(
  accounts: EmailAccount[],
  email: string,
  provider?: string
): EmailAccount | undefined {
  const targetEmail = email.trim().toLowerCase();
  return accounts.find((acc) => {
    const sameEmail = acc.email?.trim().toLowerCase() === targetEmail;
    if (!sameEmail) return false;
    if (!provider) return true;
    return (acc.provider || '').toLowerCase() === provider.toLowerCase();
  });
}

export async function confirmOverwriteOnce(message?: string): Promise<boolean> {
  const text = message || '该邮箱已存在，是否覆盖现有账户？';
  return Promise.resolve(typeof window !== 'undefined' ? window.confirm(text) : false);
}

export async function deleteExistingAccountByEmail(
  accounts: EmailAccount[],
  email: string,
  provider?: string
): Promise<boolean> {
  const existing = findExistingAccount(accounts, email, provider);
  if (!existing) return true;
  try {
    const resp = await apiClient.deleteEmailAccount(existing.id);
    return !!resp.success;
  } catch {
    return false;
  }
}

export async function createWithOverwrite(
  params: {
    email: string;
    provider?: string;
    accounts: EmailAccount[];
    createFn: () =>
      | ReturnType<typeof apiClient.createEmailAccount>
      | ReturnType<typeof apiClient.createCustomEmailAccount>
      | ReturnType<typeof apiClient.createOAuth2Account>
      | ReturnType<typeof apiClient.createManualOAuth2Account>;
    confirmFn?: (message?: string) => Promise<boolean>;
  }
): Promise<any> {
  const { email, provider, accounts, createFn, confirmFn } = params;
  const exists = findExistingAccount(accounts, email, provider);
  if (exists) {
    const ok = await (confirmFn ? confirmFn('该邮箱已存在，是否覆盖现有账户？') : confirmOverwriteOnce());
    if (!ok) {
      return { success: false, message: '已取消覆盖' };
    }
    const deleted = await deleteExistingAccountByEmail(accounts, email, provider);
    if (!deleted) {
      return { success: false, message: '删除现有账户失败' };
    }
  }
  try {
    const res: any = await createFn();
    return res;
  } catch (e: any) {
    if (e?.status === 409) {
      const ok = await (confirmFn ? confirmFn('该邮箱已存在，是否覆盖现有账户？') : confirmOverwriteOnce());
      if (!ok) return { success: false, message: '已取消覆盖' };
      const deleted = await deleteExistingAccountByEmail(accounts, email, provider);
      if (!deleted) return { success: false, message: '删除现有账户失败' };
      const retry: any = await createFn();
      return retry;
    }
    throw e;
  }
}
