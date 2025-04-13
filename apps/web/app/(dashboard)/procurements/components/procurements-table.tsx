"use client";

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { columns, defaultVisibleColumns } from "../lib/columns";
import { ColumnFilter } from "./column-filter";
import { useState, useEffect } from "react";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { useAuth } from "@/app/providers/auth-provider";
import { ProcurementContextMenu } from "./procurement-context-menu";
import { ProcurementDetailsDialog } from "./procurement-details-dialog";
import { ProcurementFormDialog } from "./procurement-form-dialog";
import { bulkDeleteProcurements } from "../lib/actions";
import { Button } from "@workspace/ui/components/button";
import { TrashIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { toast } from "sonner";
import { useProcurementsCache } from "../context/procurement-cache-context";
import type { ProcurementWithRelations } from "../lib/types";

interface ProcurementsTableProps {
  query: string;
  currentPage: number;
}

export default function ProcurementsTable({
  query,
  currentPage,
}: ProcurementsTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { fetchProcurements, prefetchPages } = useProcurementsCache();

  // State for procurements data
  const [procurements, setProcurements] = useState<ProcurementWithRelations[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // State for dialogs
  const [viewingProcurement, setViewingProcurement] =
    useState<ProcurementWithRelations | null>(null);
  const [editingProcurement, setEditingProcurement] =
    useState<ProcurementWithRelations | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for row selection (admin only)
  const [rowSelection, setRowSelection] = useState({});

  // State for column visibility
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initialVisibility: Record<string, boolean> = {};

    defaultVisibleColumns.forEach(col => {
      initialVisibility[col] = true;
    });

    return initialVisibility;
  });

  // Fetch data with caching
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch current page
        const data = await fetchProcurements(currentPage, query);
        setProcurements(data);

        // Prefetch adjacent pages
        const pagesToPrefetch = [];
        if (currentPage > 1) pagesToPrefetch.push(currentPage - 1);
        if (currentPage < 100) pagesToPrefetch.push(currentPage + 1); // Arbitrary upper limit
        if (pagesToPrefetch.length > 0) {
          prefetchPages(
            Math.min(...pagesToPrefetch),
            Math.max(...pagesToPrefetch),
            query
          );
        }
      } catch (error) {
        console.error("Error fetching procurements:", error);
        toast.error("Failed to fetch procurement data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [fetchProcurements, prefetchPages, currentPage, query]);

  // Create table instance
  const table = useReactTable({
    data: procurements,
    columns,
    state: {
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: isAdmin,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Handle view details
  const handleViewDetails = (procurement: ProcurementWithRelations) => {
    setViewingProcurement(procurement);
    setShowViewDialog(true);
  };

  // Handle edit procurement (admin only)
  const handleEditProcurement = (procurement: ProcurementWithRelations) => {
    if (isAdmin) {
      setEditingProcurement(procurement);
      setShowEditDialog(true);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const selectedProcurementIds = Object.keys(rowSelection)
        .map(index => {
          const idx = Number.parseInt(index);
          return idx >= 0 && idx < procurements.length && procurements[idx]
            ? procurements[idx].id
            : null;
        })
        .filter((id): id is number => id !== null);

      if (selectedProcurementIds.length === 0) {
        toast.error("No procurements selected for deletion.");
        setShowBulkDeleteDialog(false);
        return;
      }

      const result = await bulkDeleteProcurements(selectedProcurementIds);

      if (result.success) {
        toast("Procurements deleted successfully.");
        setRowSelection({});
      } else {
        toast.error("Failed to delete procurements.");
      }

      setShowBulkDeleteDialog(false);
    } catch (error) {
      console.error("Error bulk deleting procurements:", error);
      toast.error("Failed to delete procurements.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleViewProcurementEvent = (
      e: CustomEvent<{ procurement: ProcurementWithRelations }>
    ) => {
      handleViewDetails(e.detail.procurement);
    };

    document.addEventListener(
      "viewProcurement",
      handleViewProcurementEvent as EventListener
    );

    return () => {
      document.removeEventListener(
        "viewProcurement",
        handleViewProcurementEvent as EventListener
      );
    };
  }, []);

  const selectedCount = Object.keys(rowSelection).length;

  if (loading && procurements.length === 0) {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-28 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="rounded-md border">
          <div className="h-12 border-b bg-secondary px-4 flex items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-gray-200 rounded w-32 mx-4 animate-pulse"
              ></div>
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border-b px-4 py-4 flex items-center">
              {Array.from({ length: 6 }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 bg-gray-200 rounded w-32 mx-4 animate-pulse"
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          {isAdmin && selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedCount} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="h-8"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
        <ColumnFilter table={table} />
      </div>
      <div className="rounded-md border">
        <ScrollArea className="h-[calc(100vh-350px)]">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <ProcurementContextMenu
                    key={row.id}
                    procurement={row.original}
                    onEdit={() => handleEditProcurement(row.original)}
                    isAdmin={isAdmin}
                  >
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      onDoubleClick={() => handleViewDetails(row.original)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </ProcurementContextMenu>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {loading ? "Loading..." : "No procurements found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Procurement Details Dialog */}
      {viewingProcurement && (
        <ProcurementDetailsDialog
          procurement={viewingProcurement}
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
        />
      )}

      {/* Procurement Edit Dialog - Admin Only */}
      {isAdmin && editingProcurement && (
        <ProcurementFormDialog
          mode="edit"
          procurement={editingProcurement}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete these procurements?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {selectedCount} procurement records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
