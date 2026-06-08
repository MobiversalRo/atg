import { setRequestLocale } from 'next-intl/server';
import { listTrucks } from '@/lib/actions/yard';
import { listCrops } from '@/lib/actions/crops';
import { KanbanBoard } from '@/components/yard/kanban-board';

export default async function YardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [trucksRes, crops] = await Promise.all([listTrucks(), listCrops()]);
  return <KanbanBoard trucks={trucksRes.data} crops={crops} />;
}
