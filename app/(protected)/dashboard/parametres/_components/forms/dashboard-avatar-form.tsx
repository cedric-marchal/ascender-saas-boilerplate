"use client";

import { type ChangeEvent, type DragEvent, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { UpdateAvatarSchema } from "@/lib/schemas/avatar.schema";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type UpdateAvatarSchemaType = {
  avatar: File;
};

type DashboardAvatarFormProps = {
  name: string;
  image: string | null | undefined;
};

function DashboardAvatarForm({ name, image }: DashboardAvatarFormProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<UpdateAvatarSchemaType>({
    resolver: zodResolver(UpdateAvatarSchema),
  });

  async function onSubmit(data: UpdateAvatarSchemaType) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", data.avatar);

      const response = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Une erreur est survenue");
      }

      toast.success("Avatar mis à jour avec succès");
      setPreviewUrl(null);
      form.reset();
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileChange(file: File | null) {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={previewUrl || image || undefined} alt={name} />
            <AvatarFallback className="text-lg">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <p className="text-sm font-medium">Photo de profil</p>
            <p className="text-muted-foreground text-xs">
              JPG, PNG ou WebP. Max 5MB.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="avatar"
          render={({ field: { onChange, value, ...field } }) => {
            const [isDragging, setIsDragging] = useState(false);

            function handleDragOver(event: DragEvent<HTMLDivElement>) {
              event.preventDefault();
              setIsDragging(true);
            }

            function handleDragLeave(event: DragEvent<HTMLDivElement>) {
              event.preventDefault();
              setIsDragging(false);
            }

            function handleDrop(event: DragEvent<HTMLDivElement>) {
              event.preventDefault();
              setIsDragging(false);

              const droppedFile = event.dataTransfer.files[0];
              if (droppedFile) {
                onChange(droppedFile);
                handleFileChange(droppedFile);
              }
            }

            function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
              const selectedFile = event.target.files?.[0];
              if (selectedFile) {
                onChange(selectedFile);
                handleFileChange(selectedFile);
              }
            }

            function handleRemoveFile() {
              onChange(null);
              handleFileChange(null);
            }

            return (
              <FormItem>
                <FormLabel>Changer l&apos;avatar</FormLabel>
                <FormControl>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50",
                      value && "border-primary/50 bg-primary/5 border-solid"
                    )}
                  >
                    {value ? (
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-3">
                          {previewUrl && (
                            <div className="relative h-12 w-12 overflow-hidden rounded-md">
                              <Image
                                src={previewUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{value.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {(value.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Supprimer le fichier</span>
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload
                          className="text-muted-foreground mb-2 h-8 w-8"
                          aria-hidden="true"
                        />
                        <p className="text-muted-foreground text-sm">
                          Glissez-déposez une image ou{" "}
                          <label className="text-primary cursor-pointer font-medium hover:underline">
                            parcourir
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleInputChange}
                              className="sr-only"
                              {...field}
                            />
                          </label>
                        </p>
                      </>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  JPG, PNG ou WebP. Maximum 5 MB.
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <Button type="submit" disabled={isLoading || !form.watch("avatar")}>
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isLoading ? "Téléchargement..." : "Mettre à jour l'avatar"}
        </Button>
      </form>
    </Form>
  );
}

export { DashboardAvatarForm };
