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
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadImageToCloudinary, validateFile } from "@/hooks/use-cloudinary";

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

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

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Mot de passe requis"),
  confirmation: z.string().refine((val) => val === "SUPPRIMER", {
    message: "Vous devez taper exactement 'SUPPRIMER'",
  }),
});

export function ProfileForm() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const { regions } = useRegion();
  const { deleteAccount } = useFirebaseAuth();

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  const deleteForm = useForm<z.infer<typeof deleteAccountSchema>>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: "", confirmation: "" } as unknown as z.infer<typeof deleteAccountSchema>,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  useEffect(() => {
    // Pré-remplir l'aperçu avec l'avatar existant
    setAvatarPreview(user?.avatar || auth.currentUser?.photoURL || null);
  }, [user]);

  const onSelectAvatar: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateFile(file, 5 * 1024 * 1024, ['image/']); // 5MB max, uniquement images
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } catch (err: any) {
      toast({ title: "Fichier invalide", description: err?.message || "Image non valide", variant: "destructive" });
    }
  };

  const onRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || auth.currentUser?.photoURL || null);
  };

  const onSaveProfile = async (values: z.infer<typeof profileSchema>) => {
    if (!user?.id || !auth.currentUser) return;
    setSavingProfile(true);
    try {
      // Upload avatar si un nouveau fichier a été choisi
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadImageToCloudinary(avatarFile);
        await updateProfile(auth.currentUser, {
          photoURL: avatarUrl,
        });
      }
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
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
      });

      // Mettre à jour le contexte local immédiatement si avatar changé
      if (avatarUrl) {
        await updateUser({ avatar: avatarUrl });
      }

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

  const onDeleteAccount = async (values: z.infer<typeof deleteAccountSchema>) => {
    if (!user?.id) return;
    
    setDeletingAccount(true);
    try {
      await deleteAccount(values.password);
      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données ont été supprimés définitivement.",
      });
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur de suppression",
        description: error?.message || "Impossible de supprimer le compte. Vérifiez votre mot de passe.",
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
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
              {/* Avatar uploader */}
              <div className="sm:col-span-2 flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Photo de profil" />
                  ) : (
                    <AvatarFallback>{(user?.name || 'U').charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <label htmlFor="avatar-input">
                      <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={onSelectAvatar} />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('avatar-input')?.click()}>
                        Changer la photo
                      </Button>
                    </label>
                    {avatarFile && (
                      <Button type="button" variant="ghost" onClick={onRemoveAvatar}>Annuler</Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, max 5MB.</p>
                </div>
              </div>

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

      {/* Danger Zone */}
      <Card className="shadow-sm border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-xl text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zone de danger
          </CardTitle>
          <CardDescription className="text-red-600/80 dark:text-red-400/80">
            Actions irréversibles sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                Supprimer définitivement mon compte
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Cette action supprimera définitivement votre compte et toutes vos données associées. 
                Cette action est irréversible.
              </p>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer mon compte
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Confirmer la suppression
                    </DialogTitle>
                    <DialogDescription asChild>
                      <div className="text-left space-y-2">
                        <p className="font-medium">Cette action est irréversible !</p>
                        <p>Toutes vos données seront définitivement supprimées :</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                          <li>Votre profil utilisateur</li>
                          <li>Vos messages et conversations</li>
                          <li>Vos transports et missions</li>
                          <li>Votre historique de position</li>
                          <li>Vos gains et évaluations</li>
                          <li>Vos notifications</li>
                          <li>Les profils de vos enfants (si parent)</li>
                        </ul>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...deleteForm}>
                    <form onSubmit={deleteForm.handleSubmit(onDeleteAccount)} className="space-y-4">
                      <FormField
                        control={deleteForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mot de passe actuel</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Entrez votre mot de passe"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={deleteForm.control}
                        name="confirmation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Tapez <span className="font-mono font-bold text-red-600">SUPPRIMER</span> pour confirmer
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="SUPPRIMER"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter className="gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeleteDialogOpen(false)}
                          disabled={deletingAccount}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={deletingAccount}
                        >
                          {deletingAccount ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Suppression...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer définitivement
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
