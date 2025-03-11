import { Suspense } from 'react';
import FarmersHeader from './components/farmers-header';
import Search from './components/search';
import FarmersTable from './components/farmers-table';
import Pagination from './components/pagination';
import Loading from './loading';
import { FarmersCacheProvider } from './context/farmer-cache-context';

interface PageProps {
	searchParams?: {
		query?: string;
		page?: string;
	};
}

export default function FarmersPage({ searchParams }: PageProps) {
	const query = searchParams?.query || '';
	const currentPage = Number(searchParams?.page) || 1;

	return (
		<FarmersCacheProvider>
			<div className="w-full space-y-6">
				<FarmersHeader />

				<div className="flex items-center justify-between gap-2">
					<Search placeholder="Search by name, aadhar, survey number..." />
				</div>

				<Suspense key={query + currentPage.toString()} fallback={<Loading />}>
					<FarmersTableWithCache query={query} currentPage={currentPage} />
				</Suspense>
			</div>
		</FarmersCacheProvider>
	);
}

async function FarmersTableWithCache({ query, currentPage }: { query: string; currentPage: number }) {
	return (
		<>
			<FarmersTable query={query} currentPage={currentPage} />
			<PaginationWithCache query={query} />
		</>
	);
}

// This component handles the pagination with our cache
async function PaginationWithCache({ query }: { query: string }) {
	return <Pagination query={query} />;
}
