import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Calendar, Eye, Key, Upload, Camera, X } from "lucide-react";
import { format } from "date-fns";
import { insertUserSchema } from "@shared/schema";
import { apiRequest, apiFileUpload, queryClient } from "@/lib/queryClient";
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
  
  // Profile picture upload mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      console.log(`Starting profile picture upload for member ID: ${id}`);
      console.log(`File details: name=${file.name}, size=${file.size}, type=${file.type}`);
      
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.size);
        throw new Error('File too large. Maximum size is 5MB');
      }
      
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        console.error('Invalid file type:', file.type);
        throw new Error('Invalid file type. Allowed types: JPEG, PNG, GIF');
      }
      
      try {
        console.log('Calling apiFileUpload with URL:', `/api/members/${id}/profile-picture`);
        const response = await apiFileUpload(
          "POST", 
          `/api/members/${id}/profile-picture`, 
          file, 
          'profilePicture'
        );
        console.log('Upload response received with status:', response.status);
        const data = await response.json();
        console.log('Upload response data:', data);
        return data;
      } catch (error) {
        console.error('Upload failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Upload mutation succeeded:', data);
      // Update the viewing member with the new profile picture
      setViewingMember({ ...viewingMember, profile_picture: data.user.profile_picture });
      
      // Also update the member in the members list
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Upload mutation error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to upload profile picture',
        variant: "destructive",
      });
    },
  });
  
  // Delete profile picture mutation
  const deleteProfilePictureMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/members/${id}/profile-picture`);
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the viewing member with no profile picture
      setViewingMember({ ...viewingMember, profile_picture: null });
      
      // Also update the member in the members list
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      
      toast({
        title: "Success",
        description: "Profile picture deleted successfully",
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
  
  // Helper functions for profile picture
  const uploadProfilePicture = (id: number, file: File) => {
    uploadProfilePictureMutation.mutate({ id, file });
  };
  
  const deleteProfilePicture = (id: number) => {
    deleteProfilePictureMutation.mutate(id);
  };

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
  
  // Helper function to render profile picture or initials
  const renderProfilePicture = (member: any, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-20 h-20 text-2xl"
    };
    
    if (member.profile_picture) {
      // Log the profile picture URL for debugging
      console.log('Rendering profile picture with URL:', member.profile_picture);
      
      // Ensure the URL is absolute by prepending the base URL if it's a relative path
      const imageUrl = member.profile_picture.startsWith('http') 
        ? member.profile_picture 
        : `${window.location.origin}${member.profile_picture}`;
      
      console.log('Final image URL:', imageUrl);
      
      return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-sm`}>
          <img 
            src={imageUrl} 
            alt={member.fullName} 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image failed to load:', imageUrl);
              e.currentTarget.onerror = null; // Prevent infinite loop
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = getUserInitials(member.fullName);
              e.currentTarget.parentElement!.classList.add('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'flex', 'items-center', 'justify-center', 'text-white', 'font-bold');
            }}
          />
        </div>
      );
    } else {
      return (
        <div className={`${sizeClasses[size]} bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm`}>
          {getUserInitials(member.fullName)}
        </div>
      );
    }
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
          <DialogContent className="sm:max-w-[700px] md:max-w-[800px] max-h-[90vh] overflow-y-auto glassmorphism border-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Tambah Anggota Baru</DialogTitle>
              <DialogDescription>Isi data lengkap anggota baru</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="form-section">  
                  <h3 className="form-section-title">Informasi Dasar</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Kontak</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Keamanan</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Status Keanggotaan</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Tanggal Penting</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Pekerjaan & Pendidikan</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Alamat</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Jabatan</h3>
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
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="glassmorphism border-0"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={addMemberMutation.isPending}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {addMemberMutation.isPending ? "Menambahkan..." : "Tambah Anggota"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] md:max-w-[800px] max-h-[90vh] overflow-y-auto glassmorphism border-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Edit Anggota</DialogTitle>
              <DialogDescription>Ubah data anggota</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="form-section">
                  <h3 className="form-section-title">Informasi Dasar</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Kontak</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Status Keanggotaan</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Tanggal Penting</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Pekerjaan & Pendidikan</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Alamat</h3>
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Jabatan</h3>
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
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="glassmorphism border-0"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={editMemberMutation.isPending}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {editMemberMutation.isPending ? "Memperbarui..." : "Perbarui Anggota"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Member Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[700px] md:max-w-[800px] glassmorphism border-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Detail Anggota</DialogTitle>
              <DialogDescription>
                Informasi lengkap tentang anggota
              </DialogDescription>
            </DialogHeader>
            {viewingMember && (
              <div className="space-y-6">
                {/* Header dengan foto profil dan nama */}
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg">
                  <div className="relative group">
                    {renderProfilePicture(viewingMember, "lg")}
                    
                    {/* Profile picture upload button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-full">
                      <input 
                        type="file" 
                        id="profile-picture-upload" 
                        className="hidden" 
                        accept="image/jpeg,image/png,image/gif"
                        onChange={(e) => {
                          console.log('File input change event triggered');
                          if (e.target.files && e.target.files[0]) {
                            console.log('File selected:', e.target.files[0].name);
                            try {
                              uploadProfilePicture(viewingMember.id, e.target.files[0]);
                            } catch (error) {
                              console.error('Error in file input handler:', error);
                              toast({
                                title: "Error",
                                description: "Failed to process the selected file",
                                variant: "destructive",
                              });
                            }
                          } else {
                            console.log('No file selected');
                          }
                        }}
                      />
                      <label 
                        htmlFor="profile-picture-upload"
                        className="p-1.5 bg-white/80 rounded-full cursor-pointer hover:bg-white"
                      >
                        <Camera className="w-4 h-4 text-gray-700" />
                      </label>
                      
                      {viewingMember.profile_picture && (
                        <button 
                          onClick={() => deleteProfilePicture(viewingMember.id)}
                          className="p-1.5 bg-white/80 rounded-full cursor-pointer hover:bg-white ml-1"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{viewingMember.fullName}</h3>
                    <p className="text-muted-foreground">@{viewingMember.username}</p>
                    <div className="flex space-x-2 mt-2">
                      <Badge className={getRoleColor(viewingMember.role)}>
                        {viewingMember.role === "admin" ? "Administrator" : 
                         viewingMember.role === "ketua" ? "Ketua" : 
                         viewingMember.role === "bendahara" ? "Bendahara" : 
                         viewingMember.role === "sekretaris" ? "Sekretaris" : "Member"}
                      </Badge>
                      <Badge className={getStatusColor(viewingMember.status)}>
                        {viewingMember.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Tabs untuk mengorganisir informasi */}
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 glassmorphism border-0">
                    <TabsTrigger value="personal">Informasi Pribadi</TabsTrigger>
                    <TabsTrigger value="academic">Akademik & Pekerjaan</TabsTrigger>
                    <TabsTrigger value="organization">Organisasi</TabsTrigger>
                  </TabsList>
                  
                  {/* Tab Informasi Pribadi */}
                  <TabsContent value="personal" className="mt-4 space-y-4">
                    <Card className="glassmorphism border-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Kontak</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-sm flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {viewingMember.email}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Telepon</label>
                            <p className="text-sm flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {viewingMember.phone || "Tidak tersedia"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="glassmorphism border-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Tanggal Penting</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Tanggal Lahir</label>
                            <p className="text-sm flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                              {viewingMember.birthday 
                                ? format(new Date(viewingMember.birthday), "dd MMMM yyyy")
                                : "Tidak tersedia"
                              }
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Tiba Di Bali</label>
                            <p className="text-sm flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                              {viewingMember.arrivalDate || "Tidak tersedia"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="glassmorphism border-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Alamat</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Tempat Tinggal</label>
                          <p className="text-sm flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {viewingMember.residence || "Tidak tersedia"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Tab Akademik & Pekerjaan */}
                  <TabsContent value="academic" className="mt-4 space-y-4">
                    <Card className="glassmorphism border-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Informasi Akademik</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Kampus</label>
                          <p className="text-sm flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                            </svg>
                            {viewingMember.campus || "Tidak tersedia"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="glassmorphism border-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Informasi Pekerjaan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Pekerjaan</label>
                          <p className="text-sm flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {viewingMember.occupation || "Tidak tersedia"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Tab Organisasi */}
                  <TabsContent value="organization" className="mt-4 space-y-4">
                    <Card className="glassmorphism border-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Informasi Keanggotaan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Tanggal Bergabung</label>
                            <p className="text-sm flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                              {format(new Date(viewingMember.joinDate), "dd MMMM yyyy")}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Terdaftar Sejak</label>
                            <p className="text-sm flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                              {format(new Date(viewingMember.createdAt), "dd MMMM yyyy 'pukul' HH:mm")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="glassmorphism border-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Posisi dalam Organisasi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Peran</label>
                            <p className="text-sm">
                              <Badge className={getRoleColor(viewingMember.role)}>
                                {viewingMember.role === "admin" ? "Administrator" : 
                                 viewingMember.role === "ketua" ? "Ketua" : 
                                 viewingMember.role === "bendahara" ? "Bendahara" : 
                                 viewingMember.role === "sekretaris" ? "Sekretaris" : "Member"}
                              </Badge>
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Fungsi/Jabatan</label>
                            <p className="text-sm">
                              {viewingMember.position ? (
                                <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                                  {viewingMember.position}
                                </Badge>
                              ) : "Tidak tersedia"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailDialogOpen(false)}
                    className="glassmorphism border-0"
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleEditMember(viewingMember);
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Edit Anggota
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
                            {renderProfilePicture(member, "md")}
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
