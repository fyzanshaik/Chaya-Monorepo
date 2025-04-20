"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { useProcessingCache } from "../context/processing-cache-context";
import { useEffect, useState } from "react";

interface PaginationProps {
  query: string;
}

export default function Pagination({ query }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchTotalPages } = useProcessingCache();

  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const currentPage = Number(searchParams.get("page") || "1");

  useEffect(() => {
    async function loadTotalPages() {
      setLoading(true);
      try {
        const pages = await fetchTotalPages(query);
        setTotalPages(pages);
      } catch (error) {
        console.error("Error fetching total pages:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTotalPages();
  }, [fetchTotalPages, query]);

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  if (loading || totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-2 mt-4">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(createPageURL(1))}
          disabled={currentPage <= 1}
        >
          <ChevronsLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(createPageURL(currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(createPageURL(currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(createPageURL(totalPages))}
          disabled={currentPage >= totalPages}
        >
          <ChevronsRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
