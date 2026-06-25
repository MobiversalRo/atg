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
  // Archiving/restoring is an admin recovery function; others just see the active list.
  const canManage = can(role, 'dossiers', 'delete');
  const canCreate = can(role, 'dossiers', 'create');
  const [formOpen, setFormOpen] = React.useState(false);

  const addButton = canCreate ? (
    <Button size="sm" onClick={() => setFormOpen(true)}>
      <Plus className="size-4" />
      {t('addDossier')}
    </Button>
  ) : null;

  if (!canManage) {
    return (
      <div className="flex flex-col gap-4">
        {addButton ? <div className="flex justify-end">{addButton}</div> : null}
        <DossierTable rows={active} />
        <DossierForm open={formOpen} onOpenChange={setFormOpen} />
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
          <DossierTable rows={active} />
        </TabsContent>
        <TabsContent value="archived" className="pt-4">
          <ArchivedDossierTable rows={archived} />
        </TabsContent>
      </Tabs>
      <DossierForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
