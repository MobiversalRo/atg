import { setRequestLocale } from 'next-intl/server';
import { listProperties } from '@/lib/actions/properties';
import { PropertyTable } from '@/components/properties/property-table';

export default async function PropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { data } = await listProperties();
  return <PropertyTable data={data} />;
}
