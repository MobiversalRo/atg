'use client';

import { useTranslations } from 'next-intl';
import { useSession } from '@/components/auth/session-provider';
import { can } from '@/lib/auth/rbac';
import type { Dossier } from '@/lib/dossiers/schema';
import { DossierTable } from './dossier-table';
import { ArchivedDossierTable } from './archived-dossier-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function DossiersView({ active, archived }: { active: Dossier[]; archived: Dossier[] }) {
  const t = useTranslations('dossiers');
  const { role } = useSession();
  // Archiving/restoring is an admin recovery function; others just see the active list.
  const canManage = can(role, 'dossiers', 'delete');

  if (!canManage) return <DossierTable rows={active} />;

  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">{t('tabActive')}</TabsTrigger>
        <TabsTrigger value="archived">
          {t('tabArchived')} ({archived.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="pt-4">
        <DossierTable rows={active} />
      </TabsContent>
      <TabsContent value="archived" className="pt-4">
        <ArchivedDossierTable rows={archived} />
      </TabsContent>
    </Tabs>
  );
}
