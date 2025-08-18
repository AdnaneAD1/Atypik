"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateEmail, updatePassword, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

import { auth, db } from "@/firebase/ClientApp";
import { useAuth } from "@/lib/auth/auth-context";
import { useRegion } from "@/hooks/use-region";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  displayName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  regionId: z.string().optional(),
});

const securitySchema = z
  .object({
    currentPassword: z.string().optional(), // Non utilisé pour Firebase (réauth nécessaire côté sécurité)
    newPassword: z.string().min(6, "Min. 6 caractères").optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => (!data.newPassword && !data.confirmPassword) || data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export function ProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { regions } = useRegion();

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  const defaults = useMemo(
    () => ({
      displayName: user?.name || "",
      email: user?.email || "",
      phone: "",
      regionId: user?.regionId || "",
    }),
    [user]
  );

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });

  const securityForm = useForm<z.infer<typeof securitySchema>>({
    resolver: zodResolver(securitySchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const onSaveProfile = async (values: z.infer<typeof profileSchema>) => {
    if (!user?.id || !auth.currentUser) return;
    setSavingProfile(true);
    try {
      // Update Auth profile (displayName, photoURL)
      await updateProfile(auth.currentUser, {
        displayName: values.displayName,
      });

      // Update Auth email if changed
      if (values.email && values.email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, values.email);
      }

      // Update Firestore user document (phone, regionId, displayName as source of truth)
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        displayName: values.displayName,
        phone: values.phone || null,
        regionId: values.regionId || null,
      });

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    } catch (e: any) {
      const msg = e?.code === "auth/requires-recent-login"
        ? "Veuillez vous reconnecter pour modifier l'email."
        : e?.message || "Une erreur s'est produite";
      toast({ title: "Erreur de mise à jour", description: msg, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const onSaveSecurity = async (values: z.infer<typeof securitySchema>) => {
    if (!user?.id || !auth.currentUser) return;
    if (!values.newPassword) {
      toast({ title: "Aucun changement", description: "Renseignez un nouveau mot de passe." });
      return;
    }
    setSavingSecurity(true);
    try {
      await updatePassword(auth.currentUser, values.newPassword);
      securityForm.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Mot de passe mis à jour", description: "Votre mot de passe a été modifié." });
    } catch (e: any) {
      const msg = e?.code === "auth/requires-recent-login"
        ? "Veuillez vous reconnecter pour modifier le mot de passe."
        : e?.message || "Une erreur s'est produite";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Mon profil</CardTitle>
          <CardDescription>Gérez vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSaveProfile)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="nom@exemple.com" type="email" {...field} />
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
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="06 12 34 56 78" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Région</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une région" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Aucune région</div>
                        ) : (
                          regions.map((r) => (
                            <SelectItem value={r.id} key={r.id}>
                              {r.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <Button type="submit" disabled={savingProfile} className="min-w-32">
                  {savingProfile ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Sécurité</CardTitle>
          <CardDescription>Changez votre mot de passe</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onSaveSecurity)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={securityForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={securityForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <Button type="submit" disabled={savingSecurity} className="min-w-32">
                  {savingSecurity ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </div>
            </form>
          </Form>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">
            Conseil: Modifier l&apo;email ou le mot de passe peut nécessiter une reconnexion récente. En cas d&apo;erreur, reconnectez-vous puis réessayez.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
