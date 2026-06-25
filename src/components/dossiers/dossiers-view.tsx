'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import type { Dossier } from '@/lib/dossiers/schema';
import { DossierForm } from './dossier-form';
import { DossierTable } from './dossier-table';
import { ArchivedDossierTable } from './archived-dossier-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export function DossiersView({ active, archived }: { active: Dossier[]; archived: Dossier[] }) {
  const t = useTranslations('dossiers');
  const { role } = useSession();
  const canManage = can(role, 'dossiers', 'delete');
  const canCreate = can(role, 'dossiers', 'create');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Dossier | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (d: Dossier) => {
    setEditing(d);
    setFormOpen(true);
  };

  const addButton = canCreate ? (
    <Button size="sm" onClick={openCreate}>
      <Plus className="size-4" />
      {t('addDossier')}
    </Button>
  ) : null;

  const form = <DossierForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />;

  if (!canManage) {
    return (
      <div className="flex flex-col gap-4">
        {addButton ? <div className="flex justify-end">{addButton}</div> : null}
        <DossierTable rows={active} onEdit={openEdit} />
        {form}
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="active">
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="active">{t('tabActive')}</TabsTrigger>
            <TabsTrigger value="archived">
              {t('tabArchived')} ({archived.length})
            </TabsTrigger>
          </TabsList>
          {addButton}
        </div>
        <TabsContent value="active" className="pt-4">
          <DossierTable rows={active} onEdit={openEdit} />
        </TabsContent>
        <TabsContent value="archived" className="pt-4">
          <ArchivedDossierTable rows={archived} />
        </TabsContent>
      </Tabs>
      {form}
    </>
  );
}
