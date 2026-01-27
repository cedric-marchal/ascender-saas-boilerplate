"use client";

import { type ChangeEvent, type DragEvent, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  UpdateAvatarSchema,
  type UpdateAvatarSchemaType,
} from "@/lib/schemas/avatar.schema";
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

type AvatarFormProps = {
  currentAvatarUrl?: string;
  userName: string;
};

function AvatarForm({ currentAvatarUrl, userName }: AvatarFormProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    currentAvatarUrl
  );

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
        toast.error(result.message || "Une erreur est survenue");
        return;
      }

      toast.success("Avatar mis à jour avec succès");
      setPreviewUrl(result.data.avatarUrl);

      form.reset();
      router.refresh();
    } catch (error: unknown) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={previewUrl} alt={userName} />
            <AvatarFallback className="text-2xl">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
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
                    const objectUrl = URL.createObjectURL(droppedFile);
                    setPreviewUrl(objectUrl);
                  }
                }

                function handleFileChange(
                  event: ChangeEvent<HTMLInputElement>
                ) {
                  const selectedFile = event.target.files?.[0];
                  if (selectedFile) {
                    onChange(selectedFile);
                    const objectUrl = URL.createObjectURL(selectedFile);
                    setPreviewUrl(objectUrl);
                  }
                }

                function handleRemoveFile() {
                  onChange(undefined);
                  setPreviewUrl(currentAvatarUrl);
                }

                return (
                  <FormItem>
                    <FormLabel>Photo de profil</FormLabel>
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
                              <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                                <Image
                                  src={URL.createObjectURL(value)}
                                  alt="Aperçu"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <span className="text-sm font-medium">
                                  {value.name}
                                </span>
                                <span className="text-muted-foreground block text-xs">
                                  {(value.size / 1024 / 1024).toFixed(2)} MB
                                </span>
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
                              <span className="sr-only">
                                Supprimer le fichier
                              </span>
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload
                              className="text-muted-foreground mb-2 h-8 w-8"
                              aria-hidden="true"
                            />
                            <p className="text-muted-foreground text-center text-sm">
                              Glissez-déposez une image ou{" "}
                              <label className="text-primary cursor-pointer font-medium hover:underline">
                                parcourir
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={handleFileChange}
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
                      JPEG, PNG ou WebP. Taille maximale : 10 MB
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Form>
  );
}

export { AvatarForm };
