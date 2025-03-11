import { Suspense } from 'react';
import FarmersHeader from './components/farmers-header';
import Search from './components/search';
import FarmersTable from './components/farmers-table';
import Pagination from './components/pagination';
import { getFarmers, getFarmerPages } from './lib/data';
import Loading from './loading';

interface PageProps {
	searchParams?: {
		query?: string;
		page?: string;
	};
}

export default async function FarmersPage({ searchParams }: PageProps) {
	const { query = '', page = '1' } = (await searchParams) || {};
	const currentPage = Number(page);

	// Fetch data and total pages count
	const farmers = await getFarmers({ query, page: currentPage });
	const totalPages = await getFarmerPages(query);

	return (
		<div className="w-full space-y-6">
			{/* Header with title and action buttons */}
			<FarmersHeader />

			{/* Search and filter section */}
			<div className="flex items-center justify-between gap-2">
				<Search placeholder="Search by name, aadhar, survey number..." />
			</div>

			{/* Table with suspense fallback */}
			<Suspense key={query + currentPage.toString()} fallback={<Loading />}>
				<FarmersTable farmers={farmers} />
			</Suspense>

			{/* Pagination */}
			{totalPages > 0 && <Pagination totalPages={totalPages} />}
		</div>
	);
}
