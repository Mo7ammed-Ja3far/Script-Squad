import { useState } from "react"
import { Users, Search, Shield, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useAdminUsers, useAdminDeleteUser, useAdminToggleUser } from "@/hooks"
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getInitials, formatDate } from "@/utils/helpers"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useAdminUsers({
    role: roleFilter !== "all" ? roleFilter as UserRole : undefined,
    search: search || undefined,
    limit: 50,
  })

  const users = data?.users ?? []
  const { mutate: deleteUser, isPending: deleting } = useAdminDeleteUser()
  const { mutate: toggleUser, isPending: toggling } = useAdminToggleUser()

  const handleDelete = () => {
    if (!deleteId) return
    deleteUser(deleteId, { onSuccess: () => setDeleteId(null) })
  }

  const handleToggle = (id: string, isActive: boolean) => {
    toggleUser({ id, isActive: !isActive })
  }

  const roleColors: Record<UserRole, { badge: string; text: string }> = {
    patient: { badge: "info", text: "Patient" },
    doctor: { badge: "teal", text: "Doctor" },
    admin: { badge: "secondary", text: "Admin" },
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="User Management" description="Manage platform users and roles" />

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" className="pl-9"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="patient">Patients</SelectItem>
            <SelectItem value="doctor">Doctors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingSpinner /> : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search or filter" />
      ) : (
        <div className="space-y-3">
          {users.map(user => {
            const role = roleColors[user.role]
            return (
              <Card key={user._id} className="hover:shadow-card-hover transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <Badge variant={role.badge as any} className="text-xs">{role.text}</Badge>
                      {!user.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggle(user._id, user.isActive)}
                      disabled={toggling}
                      className={cn(
                        "gap-1.5",
                        user.isActive
                          ? "text-emerald-600 hover:bg-emerald-50"
                          : "text-amber-600 hover:bg-amber-50"
                      )}
                    >
                      {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        user.isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />
                      )}
                      {user.isActive ? "Active" : "Inactive"}
                    </Button>
                    {user.role !== "admin" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 gap-1.5"
                        onClick={() => setDeleteId(user._id)}
                      >
                        <Trash2 className="h-4 w-4" />Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. All associated data will remain in the system for records.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
