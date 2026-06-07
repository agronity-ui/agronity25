import { SimpleListPage } from '@/components/simple-list-page';
export default function Page(){ return <SimpleListPage table="apresiasi" title="Agronity Apresiasi" subtitle="Kartu apresiasi dan detail prestasi mahasiswa/tim." fields={['category','name','quote']} />; }
