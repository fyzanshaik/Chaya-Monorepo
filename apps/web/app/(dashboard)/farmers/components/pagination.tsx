'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generatePagination } from '../lib/utils';
import clsx from 'clsx';

interface PaginationProps {
	totalPages: number;
}

export default function Pagination({ totalPages }: PaginationProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentPage = Number(searchParams.get('page') || 1);

	// Generate the array of page numbers to display
	const allPages = generatePagination(currentPage, totalPages);

	// Create a new URL with the updated page parameter
	const createPageURL = (pageNumber: string | number) => {
		const params = new URLSearchParams(searchParams);
		params.set('page', pageNumber.toString());
		return `${pathname}?${params.toString()}`;
	};

	return (
		<div className="flex items-center justify-center gap-1 mt-8">
			<Button variant="outline" size="icon" className={clsx(currentPage <= 1 && 'opacity-50 cursor-not-allowed')} disabled={currentPage <= 1} asChild={currentPage > 1}>
				{currentPage > 1 ? (
					<Link href={createPageURL(currentPage - 1)}>
						<ChevronLeft className="h-4 w-4" />
					</Link>
				) : (
					<span>
						<ChevronLeft className="h-4 w-4" />
					</span>
				)}
			</Button>

			<div className="flex gap-1">
				{allPages.map((page, index) => {
					if (page === '...') {
						return (
							<Button key={`ellipsis-${index}`} variant="outline" size="icon" disabled className="cursor-default">
								...
							</Button>
						);
					}

					const isCurrentPage = page === currentPage;

					return (
						<Button key={`page-${page}`} variant={isCurrentPage ? 'default' : 'outline'} size="icon" asChild={!isCurrentPage} className={clsx('h-9 w-9')}>
							{isCurrentPage ? <span>{page}</span> : <Link href={createPageURL(page)}>{page}</Link>}
						</Button>
					);
				})}
			</div>

			<Button variant="outline" size="icon" className={clsx(currentPage >= totalPages && 'opacity-50 cursor-not-allowed')} disabled={currentPage >= totalPages} asChild={currentPage < totalPages}>
				{currentPage < totalPages ? (
					<Link href={createPageURL(currentPage + 1)}>
						<ChevronRight className="h-4 w-4" />
					</Link>
				) : (
					<span>
						<ChevronRight className="h-4 w-4" />
					</span>
				)}
			</Button>
		</div>
	);
}
