import { Suspense } from 'react';
import ProcessingHeader from './components/processing-header';
import Search from './components/search';
import ProcessingTable from './components/processing-table';
import Loading from './loading';
import { ProcessingCacheProvider } from './context/processing-cache-context';

interface PageProps {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function ProcessingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.query || '';
  const currentPage = Number(params?.page) || 1;

  return (
    <ProcessingCacheProvider>
      <div className="space-y-6 p-4">
        <ProcessingHeader />

        <div className="flex items-center justify-between gap-2">
          <Search placeholder="Enter batch code, crop, or status" />
        </div>
        <Suspense key={query + currentPage.toString()} fallback={<Loading />}>
          <ProcessingTable query={query} currentPage={currentPage} />
        </Suspense>
      </div>
    </ProcessingCacheProvider>
  );
}
