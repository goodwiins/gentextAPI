import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { fetchUserId } from '../utils/auth';// Adjust the import path based on your project structure




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




export type Interaction = {
  id: number
  input_text: string
  response_text: string
  timestamp: string
  user_id: string
}

export const interactionColumns: ColumnDef<Interaction>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "input_text",
    header: "Input Text",
    cell: ({ row }) => (
      <div className="truncate" title={row.getValue("input_text")}>
        {row.getValue("input_text")}
      </div>
    ),
  },
  {
    accessorKey: "response_text",
    header: "Response Text",
    cell: ({ row }) => (
      <div className="truncate" title={row.getValue("response_text")}>
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
      const interaction = row.original
      return (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(interaction)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDelete(interaction.id)}>
            Delete
          </Button>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]





export default function history() {
  const router = useRouter();
  const [sessionData, setSessionData] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  

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
  })


  useEffect(() => {
    if (router.isReady) {
      fetchUserId().then(user_id => {

        if (user_id) {
          // Fetch user interactions
          axios
            .get(`http://127.0.0.1:8000/api/user/${user_id}/interactions`, {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem('token')}`
              }
            })
            .then((response) => {
              console.log("User interactions:", response.data);
              sessionStorage.setItem('userData', JSON.stringify(response.data));
              setInteractions(response.data); // Store the interactions
            })
            .catch((error) => {
              console.error("Error fetching user interactions:", error);
            });
        }
      });
    }
  }, [router.isReady]);
  return (
    <div className="mx-auto">
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
    </div>
  )
     
  
}