import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listParcels } from '@/lib/actions/parcels';
import { listLeases } from '@/lib/actions/leases';
import { getSiloBoard } from '@/lib/actions/inventory';
import { listProperties } from '@/lib/actions/properties';
import { ParcelTable } from '@/components/farm/parcel-table';
import { LeaseTable } from '@/components/farm/lease-table';
import { SiloBoard } from '@/components/farm/silo-board';

export default async function FarmPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('farm');

  const [parcelsRes, leasesRes, board, propsRes] = await Promise.all([
    listParcels(),
    listLeases(),
    getSiloBoard(),
    listProperties(),
  ]);

  const properties = propsRes.data.map((p) => ({ id: p.id, name: p.name }));
  const parcelOptions = parcelsRes.data.map((p) => ({ id: p.id, topo_code: p.topo_code }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <Tabs defaultValue="parcels">
        <TabsList>
          <TabsTrigger value="parcels">{t('tabParcels')}</TabsTrigger>
          <TabsTrigger value="leases">{t('tabLeases')}</TabsTrigger>
          <TabsTrigger value="silos">{t('tabSilos')}</TabsTrigger>
        </TabsList>
        <TabsContent value="parcels" className="pt-4">
          <ParcelTable data={parcelsRes.data} crops={board.crops} properties={properties} />
        </TabsContent>
        <TabsContent value="leases" className="pt-4">
          <LeaseTable data={leasesRes.data} parcels={parcelOptions} />
        </TabsContent>
        <TabsContent value="silos" className="pt-4">
          <SiloBoard silos={board.silos} crops={board.crops} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
