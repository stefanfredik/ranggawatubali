import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, Calendar, Eye, Key } from "lucide-react";
import { format } from "date-fns";
import { insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema for adding new members
const addMemberSchema = insertUserSchema.extend({
  role: z.enum(["admin", "member", "ketua", "bendahara", "sekretaris"]).default("member"),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
  occupation: z.enum(["Mahasiswa", "Bekerja", "Bekerja Sambil Kuliah"]).optional(),
  campus: z.string().optional(),
  residence: z.string().optional(),
  arrivalDate: z.string().optional(),
  position: z.enum(["Ketua", "Wakil Ketua", "Bendahara", "Sekretaris", "Suka Duka", "Kerohanian", "Konsumsi"]).optional(),
});

// Form schema for editing members (password is optional)
const editMemberSchema = insertUserSchema.partial({ password: true }).extend({
  role: z.enum(["admin", "member", "ketua", "bendahara", "sekretaris"]),
  status: z.enum(["active", "inactive", "pending"]),
  occupation: z.enum(["Mahasiswa", "Bekerja", "Bekerja Sambil Kuliah"]).optional(),
  campus: z.string().optional(),
  residence: z.string().optional(),
  arrivalDate: z.string().optional(),
  position: z.enum(["Ketua", "Wakil Ketua", "Bendahara", "Sekretaris", "Suka Duka", "Kerohanian", "Konsumsi"]).optional(),
});

// Form schema for changing password
const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AddMemberForm = z.infer<typeof addMemberSchema>;
type EditMemberForm = z.infer<typeof editMemberSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export function MembersTable() {
  const { data: members, isLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [viewingMember, setViewingMember] = useState<any>(null);
  const [passwordMember, setPasswordMember] = useState<any>(null);

  const form = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      phone: "",
      role: "member",
      status: "active",
      joinDate: new Date().toISOString().split('T')[0],
      birthday: "",
      occupation: undefined,
      campus: "",
      residence: "",
      arrivalDate: "",
      position: undefined,
    },
  });

  const editForm = useForm<EditMemberForm>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      phone: "",
      role: "member",
      status: "active",
      joinDate: "",
      birthday: "",
      occupation: undefined,
      campus: "",
      residence: "",
      arrivalDate: "",
      position: undefined,
    },
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: AddMemberForm) => {
      const res = await apiRequest("POST", "/api/members", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Member added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editMemberMutation = useMutation({
    mutationFn: async (data: { id: number; updates: EditMemberForm }) => {
      const res = await apiRequest("PUT", `/api/members/${data.id}`, data.updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setIsEditDialogOpen(false);
      setEditingMember(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/members/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { id: number; password: string }) => {
      const res = await apiRequest("PATCH", `/api/members/${data.id}/password`, {
        password: data.password,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddMemberForm) => {
    addMemberMutation.mutate(data);
  };

  const onEditSubmit = (data: EditMemberForm) => {
    if (editingMember) {
      editMemberMutation.mutate({ id: editingMember.id, updates: data });
    }
  };

  const handleEditMember = (member: any) => {
    setEditingMember(member);
    editForm.reset({
      username: member.username,
      email: member.email,
      fullName: member.fullName,
      phone: member.phone || "",
      role: member.role,
      status: member.status,
      joinDate: member.joinDate,
      birthday: member.birthday || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteMember = (id: number) => {
    deleteMemberMutation.mutate(id);
  };

  const handleViewMember = (member: any) => {
    setViewingMember(member);
    setIsDetailDialogOpen(true);
  };

  const handleChangePassword = (member: any) => {
    setPasswordMember(member);
    setIsPasswordDialogOpen(true);
  };

  const onPasswordSubmit = (data: ChangePasswordForm) => {
    if (passwordMember) {
      changePasswordMutation.mutate({
        id: passwordMember.id,
        password: data.newPassword,
      });
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
      case "inactive":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100";
      case "member":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100";
      case "ketua":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
      case "bendahara":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
      case "sekretaris":
        return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100";
    }
  };

  const filteredMembers = (members || []).filter((member: any) => {
    const matchesSearch = member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Member Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage organization members and their profiles
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Plus className="mr-2" size={16} />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] glassmorphism border-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Add New Member</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} className="glassmorphism border-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} className="glassmorphism border-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} className="glassmorphism border-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter phone number" 
                            {...field} 
                            value={field.value || ""} 
                            className="glassmorphism border-0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} className="glassmorphism border-0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="glassmorphism border-0">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="ketua">Ketua</SelectItem>
                            <SelectItem value="bendahara">Bendahara</SelectItem>
                            <SelectItem value="sekretaris">Sekretaris</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="glassmorphism border-0">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="joinDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Join Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="glassmorphism border-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birthday (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ""} 
                            className="glassmorphism border-0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="arrivalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiba Di Bali (Bulan/Tahun)</FormLabel>
                        <FormControl>
                          <Input 
                            type="month" 
                            {...field} 
                            value={field.value || ""} 
                            className="glassmorphism border-0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pekerjaan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="glassmorphism border-0">
                              <SelectValue placeholder="Pilih pekerjaan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mahasiswa">Mahasiswa</SelectItem>
                            <SelectItem value="Bekerja">Bekerja</SelectItem>
                            <SelectItem value="Bekerja Sambil Kuliah">Bekerja Sambil Kuliah</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="campus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kampus (Opsional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nama kampus" 
                            {...field} 
                            value={field.value || ""} 
                            className="glassmorphism border-0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="residence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempat Tinggal (Alamat)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Alamat tempat tinggal" 
                          {...field} 
                          value={field.value || ""} 
                          className="glassmorphism border-0" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fungsi atau Jabatan (Opsional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="glassmorphism border-0">
                              <SelectValue placeholder="Pilih fungsi atau jabatan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ketua">Ketua</SelectItem>
                            <SelectItem value="Wakil Ketua">Wakil Ketua</SelectItem>
                            <SelectItem value="Bendahara">Bendahara</SelectItem>
                            <SelectItem value="Sekretaris">Sekretaris</SelectItem>
                            <SelectItem value="Suka Duka">Suka Duka</SelectItem>
                            <SelectItem value="Kerohanian">Kerohanian</SelectItem>
                            <SelectItem value="Konsumsi">Konsumsi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="glassmorphism border-0"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addMemberMutation.isPending}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] glassmorphism border-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Edit Member</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} className="glassmorphism border-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} className="glassmorphism border-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} className="glassmorphism border-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter phone number" 
                            {...field} 
                            value={field.value || ""} 
                            className="glassmorphism border-0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glassmorphism border-0">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="ketua">Ketua</SelectItem>
                            <SelectItem value="bendahara">Bendahara</SelectItem>
                            <SelectItem value="sekretaris">Sekretaris</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glassmorphism border-0">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="joinDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Join Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="glassmorphism border-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birthday (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ""} 
                            className="glassmorphism border-0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="arrivalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiba Di Bali (Bulan/Tahun)</FormLabel>
                        <FormControl>
                          <Input 
                            type="month" 
                            {...field} 
                            value={field.value || ""} 
                            className="glassmorphism border-0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pekerjaan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glassmorphism border-0">
                              <SelectValue placeholder="Pilih pekerjaan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mahasiswa">Mahasiswa</SelectItem>
                            <SelectItem value="Bekerja">Bekerja</SelectItem>
                            <SelectItem value="Bekerja Sambil Kuliah">Bekerja Sambil Kuliah</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="campus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kampus (Opsional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nama kampus" 
                            {...field} 
                            value={field.value || ""} 
                            className="glassmorphism border-0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="residence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempat Tinggal (Alamat)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Alamat tempat tinggal" 
                          {...field} 
                          value={field.value || ""} 
                          className="glassmorphism border-0" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fungsi atau Jabatan (Opsional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="glassmorphism border-0">
                            <SelectValue placeholder="Pilih fungsi atau jabatan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ketua">Ketua</SelectItem>
                          <SelectItem value="Wakil Ketua">Wakil Ketua</SelectItem>
                          <SelectItem value="Bendahara">Bendahara</SelectItem>
                          <SelectItem value="Sekretaris">Sekretaris</SelectItem>
                          <SelectItem value="Suka Duka">Suka Duka</SelectItem>
                          <SelectItem value="Kerohanian">Kerohanian</SelectItem>
                          <SelectItem value="Konsumsi">Konsumsi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="glassmorphism border-0"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editMemberMutation.isPending}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {editMemberMutation.isPending ? "Updating..." : "Update Member"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Member Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[500px] glassmorphism border-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Member Details</DialogTitle>
            </DialogHeader>
            {viewingMember && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {viewingMember.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{viewingMember.fullName}</h3>
                    <p className="text-muted-foreground">@{viewingMember.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="glassmorphism p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm mt-1">{viewingMember.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-sm mt-1">{viewingMember.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="glassmorphism p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Role</label>
                        <div className="mt-1">
                          <Badge className={getRoleColor(viewingMember.role)}>
                            {viewingMember.role === "admin" ? "Administrator" : 
                             viewingMember.role === "ketua" ? "Ketua" : 
                             viewingMember.role === "bendahara" ? "Bendahara" : 
                             viewingMember.role === "sekretaris" ? "Sekretaris" : "Member"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                          <Badge className={getStatusColor(viewingMember.status)}>
                            {viewingMember.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glassmorphism p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Join Date</label>
                        <p className="text-sm mt-1 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(viewingMember.joinDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Birthday</label>
                        <p className="text-sm mt-1 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {viewingMember.birthday 
                            ? format(new Date(viewingMember.birthday), "MMM dd, yyyy")
                            : "Not provided"
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glassmorphism p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Pekerjaan</label>
                        <p className="text-sm mt-1">
                          {viewingMember.occupation || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Kampus</label>
                        <p className="text-sm mt-1">
                          {viewingMember.campus || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glassmorphism p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tiba Di Bali</label>
                        <p className="text-sm mt-1">
                          {viewingMember.arrivalDate || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Fungsi/Jabatan</label>
                        <p className="text-sm mt-1">
                          {viewingMember.position || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glassmorphism p-4 rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Tempat Tinggal</label>
                    <p className="text-sm mt-1">
                      {viewingMember.residence || "Not provided"}
                    </p>
                  </div>

                  <div className="glassmorphism p-4 rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                    <p className="text-sm mt-1">
                      {format(new Date(viewingMember.createdAt), "MMMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailDialogOpen(false)}
                    className="glassmorphism border-0"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleEditMember(viewingMember);
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Edit Member
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[400px] glassmorphism border-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Change Password</DialogTitle>
            </DialogHeader>
            {passwordMember && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-4 border-b border-border/50">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {passwordMember.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium">{passwordMember.fullName}</h3>
                    <p className="text-sm text-muted-foreground">@{passwordMember.username}</p>
                  </div>
                </div>

                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter new password" 
                              {...field} 
                              className="glassmorphism border-0" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm new password" 
                              {...field} 
                              className="glassmorphism border-0" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsPasswordDialogOpen(false);
                          passwordForm.reset();
                        }}
                        className="glassmorphism border-0"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                      >
                        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card className="glassmorphism-card border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glassmorphism border-0"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 glassmorphism border-0">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32 glassmorphism border-0">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="ketua">Ketua</SelectItem>
                  <SelectItem value="bendahara">Bendahara</SelectItem>
                  <SelectItem value="sekretaris">Sekretaris</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="glassmorphism-card border-0">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-glass-border">
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!filteredMembers?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member: any) => (
                      <TableRow
                        key={member.id}
                        className="border-glass-border hover:bg-muted/5"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {getUserInitials(member.fullName)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{member.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                @{member.username}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{member.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.phone || "No phone"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(member.joinDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewMember(member)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditMember(member)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleChangePassword(member)}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              <Key size={14} />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 size={14} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glassmorphism border-0">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {member.fullName}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="glassmorphism border-0">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteMember(member.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                    disabled={deleteMemberMutation.isPending}
                                  >
                                    {deleteMemberMutation.isPending ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
