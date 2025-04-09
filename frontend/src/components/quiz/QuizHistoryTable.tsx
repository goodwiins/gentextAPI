import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/Icons';
import { QuizItem, quizService } from '@/lib/quizService';

interface QuizHistoryTableProps {
  quizzes: QuizItem[];
  onDeleteSuccess: (id: string) => void;
  onRefresh: () => void;
}

export const QuizHistoryTable: React.FC<QuizHistoryTableProps> = ({
  quizzes,
  onDeleteSuccess,
  onRefresh,
}) => {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleView = useCallback((quiz: QuizItem) => {
    router.push(`/quiz/${quiz.$id}`);
  }, [router]);

  const handleDelete = useCallback(async (id: string, e?: React.MouseEvent) => {
    // Stop event propagation to prevent row click handler
    if (e) {
      e.stopPropagation();
    }
    
    try {
      setIsDeleting(id);
      await quizService.deleteQuiz(id);
      onDeleteSuccess(id);
      toast.success('Quiz deleted successfully');
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error(`Failed to delete quiz: ${quizService.getErrorMessage(error)}`);
    } finally {
      setIsDeleting(null);
    }
  }, [onDeleteSuccess]);

  const columns: ColumnDef<QuizItem>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2"
        >
          Title
       
        </Button>
      ),
      cell: ({ row }) => {
        const title = row.getValue("title") as string || "Untitled Quiz";
        return (
          <div className="font-medium">
            {title}
          </div>
        );
      },
    },
    {
      accessorKey: "text",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2"
        >
          Content
          
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[500px]">
          <p className="truncate text-gray-600 dark:text-gray-400" title={row.getValue("text")}>
            {row.getValue("text")}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2"
        >
          Date
          
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="font-medium">
            {date.toLocaleDateString()} 
            <div className="text-sm text-muted-foreground">
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const quiz = row.original;
        const isCurrentlyDeleting = isDeleting === quiz.$id;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0" 
                disabled={isCurrentlyDeleting}
                onClick={(e) => e.stopPropagation()} // Prevent row click
              >
                {isCurrentlyDeleting ? (
                  <Icons.Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Icons.Settings className="h-4 w-4" />
                )}
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleView(quiz)}>
                <Icons.Eye className="mr-2 h-4 w-4" />
                View Quiz
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => handleDelete(quiz.$id, e)}
                className="text-red-600 dark:text-red-400"
                disabled={isCurrentlyDeleting}
              >
                <Icons.Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: quizzes,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <Input
          placeholder="Filter quizzes..."
          value={(table.getColumn("text")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("text")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <Icons.RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Icons.Settings className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id === "text" ? "Content" : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/20"
                  onClick={() => handleView(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-4">
                    <Icons.FileQuestion className="h-8 w-8 mb-2 text-gray-400" />
                    <p className="text-gray-500">No quizzes found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} quiz{table.getFilteredRowModel().rows.length !== 1 ? 'zes' : ''} found.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <Icons.Rocket className="mr-2 h-4 w-4 rotate-180" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount() || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <Icons.Rocket className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default QuizHistoryTable; 