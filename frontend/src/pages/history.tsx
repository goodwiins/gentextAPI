// frontend/src/pages/history.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { fetchUserId } from '../utils/auth';

import * as React from "react"
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
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface Interaction {
  id: number;
  input_text: string;
  response_text: string;
  timestamp: string;
  user_id: string;
}

export interface ApiResponse {
  interactions: Interaction[];
  total: number;
  pages: number;
  page: number;
}

export default function History() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1
  });
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  // Define the handlers that were missing
  const handleEdit = (interaction: Interaction) => {
    console.log("Editing interaction:", interaction);
    // You can implement edit functionality here
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this interaction?")) {
      try {
        // API call to delete (you need to implement the endpoint)
        // await axios.delete(`http://127.0.0.1:8000/api/interaction/${id}`, {
        //   headers: {
        //     Authorization: `Bearer ${sessionStorage.getItem('token')}`
        //   }
        // });
        
        // For now, just remove it from local state
        setInteractions(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error("Error deleting interaction:", error);
      }
    }
  };

  // Define columns with proper TypeScript typing
  const interactionColumns: ColumnDef<Interaction>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "input_text",
      header: "Input Text",
      cell: ({ row }) => (
        <div className="truncate max-w-xs" title={row.getValue("input_text")}>
          {row.getValue("input_text")}
        </div>
      ),
    },
    {
      accessorKey: "response_text",
      header: "Response Text",
      cell: ({ row }) => (
        <div className="truncate max-w-xs" title={row.getValue("response_text")}>
          {row.getValue("response_text")}
        </div>
      ),
    },
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <div>{new Date(row.getValue("timestamp")).toLocaleString()}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const interaction = row.original;
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(interaction)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDelete(interaction.id)}>
              Delete
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data: interactions,
    columns: interactionColumns,
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
  });

  useEffect(() => {
    if (router.isReady) {
      fetchUserInteractions();
    }
  }, [router.isReady]);

  const fetchUserInteractions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user_id = await fetchUserId();
      
      if (!user_id) {
        router.push("/login");
        return;
      }
      
      const response = await axios.get<ApiResponse>(
        `http://127.0.0.1:8000/api/user/${user_id}/interactions`, 
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );
      
      // Check if response has the expected structure
      if (response.data && response.data.interactions) {
        setInteractions(response.data.interactions);
        setPagination({
          total: response.data.total,
          pages: response.data.pages,
          page: response.data.page
        });
      } else {
        // If the API returns a different structure, adapt accordingly
        const data = response.data as unknown;
        if (Array.isArray(data)) {
          setInteractions(data as Interaction[]);
        } else {
          console.error("Unexpected API response format:", response.data);
          setError("Unexpected data format received from the server");
        }
      }
      
    } catch (error) {
      console.error("Error fetching user interactions:", error);
      setError("Failed to load your interaction history. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Your Interaction History</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          <p className="ml-4 text-lg">Loading your history...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      ) : interactions.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-600">You don't have any interactions yet.</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/')}
          >
            Create Your First Quiz
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter input text..."
              value={(table.getColumn("input_text")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("input_text")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
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
                      colSpan={interactionColumns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}