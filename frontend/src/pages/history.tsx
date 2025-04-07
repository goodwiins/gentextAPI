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

// Environment variables with fallbacks
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';

// Initialize Appwrite with proper error handling
let client: Client;
let databases: Databases;

try {
  client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
  
  databases = new Databases(client);
} catch (error) {
  console.error('Failed to initialize Appwrite client:', error);
  // Will be handled in the component
}

export interface Interaction extends Models.Document {
  text: string;
  title: string;
  createdAt: string;
  userId: string;
  questions: string;
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
  
  // Check for missing configuration
  useEffect(() => {
    if (!APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_ID) {
      setError("Missing Appwrite configuration. Please check your environment variables.");
      setIsLoading(false);
    }
  }, []);
  
  const handleDelete = async (id: string) => {
    try {
      if (!databases || !APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_ID) {
        throw new Error("Appwrite not properly configured");
      }

      setIsLoading(true);
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        id
      );
      
      setInteractions(prev => prev.filter(item => item.$id !== id));
      toast.success('Quiz deleted successfully');
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error('Failed to delete quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (interaction: Interaction) => {
    router.push(`/quiz/${interaction.$id}`);
  };

  const interactionColumns: ColumnDef<Interaction>[] = [
    {
      accessorKey: "text",
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
          <p className="truncate font-medium" title={row.getValue("text")}>
            {row.getValue("text")}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
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
          {new Date(row.getValue("createdAt")).toLocaleDateString()} 
          <div className="text-sm text-muted-foreground">
            {new Date(row.getValue("createdAt")).toLocaleTimeString()}
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
        if (!databases || !APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_ID) {
          throw new Error("Appwrite not properly configured");
        }

        setIsLoading(true);
        setError(null);

        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_ID,
          [
            Query.equal('userId', authState.user?.$id || ''),
            Query.orderDesc('createdAt'),
            Query.limit(100)
          ]
        );

        if (response.documents.length === 0) {
          console.log('No documents found for this user');
        }
        
        setInteractions(response.documents as Interaction[]);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        setError("Failed to load your quiz history. " + (error instanceof Error ? error.message : ""));
        toast.error("Failed to load history");
      } finally {
        setIsLoading(false);
      }
    };

    if (authState.user) {
      fetchInteractions();
    }
  }, [authState, router]);

  if (authState.isLoading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p>Loading account information...</p>
      </div>
    );
  }

  if (!authState.user) {
    return (
      <div className="container mx-auto py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">Please log in to view your quiz history.</p>
            <Button className="mt-4" onClick={() => { window.location.href = '/login'; }}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your quiz history...</p>
            </div>
          ) : error ? (
            <div className="py-8 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
                <h3 className="font-medium text-red-800 dark:text-red-400">Error loading your quiz history</h3>
                <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                <p className="text-red-600 dark:text-red-400 mt-2">
                  This might be happening because of a database configuration issue or missing fields in the Appwrite collection.
                </p>
              </div>
              
              <div className="flex space-x-4">
                <Button onClick={() => window.location.href = '/setup'}>
                  Go to Setup Page
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/debug'}>
                  Debug Connection
                </Button>
              </div>
            </div>
          ) : interactions.length === 0 ? (
            <div className="py-8 space-y-4 text-center">
              <p className="text-gray-600 dark:text-gray-400">You haven't created any quizzes yet.</p>
              <Button onClick={() => window.location.href = '/'}>
                Create Your First Quiz
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 py-4">
                <Input
                  placeholder="Filter by text..."
                  value={(table.getColumn("text")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("text")?.setFilterValue(event.target.value)
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