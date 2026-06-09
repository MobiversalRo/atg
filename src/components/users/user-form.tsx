'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { createUserSchema, updateUserSchema, USER_ROLES } from '@/lib/users/schema';
import { createUser, updateUser, type UserRow } from '@/lib/actions/users';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

type FormValues = {
  email: string;
  password: string;
  full_name: string;
  role: (typeof USER_ROLES)[number];
};

export function UserForm({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: UserRow | null;
}) {
  const t = useTranslations('users');
  const tc = useTranslations('common');
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: '', password: '', full_name: '', role: 'operator' },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      email: editing?.email ?? '',
      password: '',
      full_name: editing?.full_name ?? '',
      role: editing?.role ?? 'operator',
    });
  }, [open, editing, reset]);

  async function onSubmit(values: FormValues) {
    if (editing) {
      const parsed = updateUserSchema.safeParse({
        full_name: values.full_name,
        role: values.role,
        password: values.password,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? tc('invalid'));
        return;
      }
      const res = await updateUser(editing.id, parsed.data);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
    } else {
      const parsed = createUserSchema.safeParse(values);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? tc('invalid'));
        return;
      }
      const res = await createUser(parsed.data);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
    }
    toast.success(tc('saved'));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editing ? t('editUser') : t('addUser')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <div className="grid gap-1.5">
            <Label htmlFor="user-email">{t('email')}</Label>
            <Input
              id="user-email"
              type="email"
              autoComplete="off"
              disabled={!!editing}
              {...register('email', { required: !editing })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="user-fullname">{t('fullName')}</Label>
            <Input id="user-fullname" {...register('full_name')} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="user-role">{t('role')}</Label>
            <NativeSelect id="user-role" {...register('role')}>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`role_${r}`)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="user-password">{t('password')}</Label>
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              {...register('password', { required: !editing })}
            />
            {editing ? (
              <p className="text-xs text-muted-foreground">{t('passwordKeep')}</p>
            ) : null}
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={isSubmitting}>
              {tc('save')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
