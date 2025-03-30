// frontend/src/pages/history.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useAuthContext } from "@/context/auth-context";
import { Client, Databases, Query, Models } from "appwrite";

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
import { Icons } from "@/components/Icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

const databases = new Databases(client);

export interface Interaction extends Models.Document {
  input_text: string;
  response_text: string;
  created_at: string;
  user_id: string;
}

export default function History() {
  const router = useRouter();
  const { authState } = useAuthContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '',
        id
      );
      
      setInteractions(prev => prev.filter(item => item.$id !== id));
      toast.success('Interaction deleted successfully');
    } catch (error) {
      console.error("Error deleting interaction:", error);
      toast.error('Failed to delete interaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (interaction: Interaction) => {
    // Store the interaction data in session storage
    sessionStorage.setItem('viewInteraction', JSON.stringify(interaction));
    router.push(`/quiz?id=${interaction.$id}`);
  };

  const interactionColumns: ColumnDef<Interaction>[] = [
    {
      accessorKey: "input_text",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2"
          >
            Text Input
            <Icons.Type className="h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="max-w-[500px]">
          <p className="truncate font-medium" title={row.getValue("input_text")}>
            {row.getValue("input_text")}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2"
          >
            Date
            <Icons.Type className="h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium">
          {new Date(row.getValue("created_at")).toLocaleDateString()} 
          <div className="text-sm text-muted-foreground">
            {new Date(row.getValue("created_at")).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const interaction = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Icons.Settings className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleView(interaction)}>
                <Icons.Type className="mr-2 h-4 w-4" />
                View Quiz
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(interaction.$id)}
                className="text-red-600 dark:text-red-400"
              >
                <Icons.AlertCircle className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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
    if (!authState.isLoading && !authState.user) {
      router.push("/login");
      return;
    }

    const fetchInteractions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '',
          [
            Query.equal('user_id', authState.user?.$id || ''),
            Query.orderDesc('created_at'),
            Query.limit(100)
          ]
        );

        setInteractions(response.documents as Interaction[]);
      } catch (error) {
        console.error("Error fetching interactions:", error);
        setError("Failed to load your interaction history");
        toast.error("Failed to load history");
      } finally {
        setIsLoading(false);
      }
    };

    if (authState.user) {
      fetchInteractions();
    }
  }, [authState, router]);

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="hidden md:flex"
        >
          <Icons.PlusCircle className="mr-2 h-4 w-4" />
          New Quiz
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Quiz History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Icons.Loader className="h-8 w-8 animate-spin" />
              <p className="ml-4 text-lg">Loading your history...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg" role="alert">
              <p className="font-medium">{error}</p>
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-10">
              <Icons.Type className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No quizzes yet</h3>
              <p className="mt-2 text-muted-foreground">
                Get started by creating your first quiz.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => router.push('/')}
              >
                Create Quiz
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 py-4">
                <Input
                  placeholder="Filter by text..."
                  value={(table.getColumn("input_text")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("input_text")?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Icons.Settings className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[150px]">
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
                          No results found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}