import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const announcementSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  content: z.string().min(10, "Konten minimal 10 karakter"),
  type: z.enum(["general", "important", "event", "system"], {
    required_error: "Pilih tipe pengumuman",
  }),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface AnnouncementFormProps {
  announcement?: {
    id: number;
    title: string;
    content: string;
    type: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AnnouncementForm({
  announcement,
  onSuccess,
  onCancel,
}: AnnouncementFormProps) {
  const isEditing = !!announcement;
  const queryClient = useQueryClient();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement?.title || "",
      content: announcement?.content || "",
      type: (announcement?.type as any) || "general",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementFormValues) => {
      const response = await apiRequest("POST", "/api/announcements", data);
      return response.json();
    },
    onSuccess: () => {
      toast.success("Pengumuman berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.message || "Gagal membuat pengumuman. Silakan coba lagi."
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AnnouncementFormValues) => {
      const response = await apiRequest("PUT", `/api/announcements/${announcement?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast.success("Pengumuman berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.message || "Gagal memperbarui pengumuman. Silakan coba lagi."
      );
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function onSubmit(data: AnnouncementFormValues) {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul</FormLabel>
              <FormControl>
                <Input placeholder="Judul pengumuman" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konten</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Isi pengumuman"
                  className="min-h-32"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe pengumuman" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="general">Umum</SelectItem>
                  <SelectItem value="important">Penting</SelectItem>
                  <SelectItem value="event">Acara</SelectItem>
                  <SelectItem value="system">Sistem</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Batal
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Perbarui" : "Simpan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}