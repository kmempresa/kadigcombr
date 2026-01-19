import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, Edit3, Check, X, Camera, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: {
    email?: string;
    profile?: {
      full_name?: string | null;
      phone?: string | null;
      birth_date?: string | null;
      avatar_url?: string | null;
    } | null;
  } | null;
  onProfileUpdate?: () => void;
}

const ProfileDrawer = ({ open, onOpenChange, userData, onProfileUpdate }: ProfileDrawerProps) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    birth_date: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (userData?.profile) {
      setFormData({
        full_name: userData.profile.full_name || "",
        phone: userData.profile.phone || "",
        birth_date: userData.profile.birth_date || "",
        avatar_url: userData.profile.avatar_url || "",
      });
    }
  }, [userData]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      const userId = session.user.id;
      const fileExt = (file.name.split(".").pop() || "png").toLowerCase();
      const uniqueId = (globalThis.crypto && "randomUUID" in globalThis.crypto)
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}`;
      const fileName = `${userId}/avatar-${uniqueId}.${fileExt}`;

      // Delete previous avatar if we can infer its path
      const currentUrl = (userData?.profile?.avatar_url || formData.avatar_url || "").split("?")[0];
      const marker = "/avatars/";
      const idx = currentUrl.indexOf(marker);
      if (idx !== -1) {
        const oldPath = currentUrl.slice(idx + marker.length);
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true, cacheControl: "0" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Update UI immediately
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      // allow selecting the same file again
      event.target.value = "";
      toast.success("Foto de perfil atualizada!");
      onProfileUpdate?.();
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Erro ao enviar foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          birth_date: formData.birth_date || null,
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
      onProfileUpdate?.();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`max-h-[90vh] ${theme === "light" ? "light-theme" : ""}`}>
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-xl font-bold text-foreground">Meu Perfil</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-6">
          {/* Avatar with upload */}
          <motion.div 
            className="flex flex-col items-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="relative">
              {formData.avatar_url ? (
                <img 
                  src={formData.avatar_url} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-background"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-white font-bold text-3xl">
                    {formData.full_name?.charAt(0)?.toUpperCase() || userData?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              
              {/* Camera button for photo upload */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </motion.button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {/* Edit button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(!isEditing)}
                className={`absolute -bottom-1 -left-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                  isEditing ? "bg-destructive" : "bg-muted"
                }`}
              >
                {isEditing ? (
                  <X className="w-4 h-4 text-white" />
                ) : (
                  <Edit3 className="w-4 h-4 text-foreground" />
                )}
              </motion.button>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {formData.full_name || "Adicione seu nome"}
            </p>
            <p className="text-sm text-muted-foreground">{userData?.email}</p>
          </motion.div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Nome */}
            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome completo
              </label>
              {isEditing ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="h-12 bg-muted/30 border-border"
                />
              ) : (
                <div className="h-12 px-4 bg-card border border-border rounded-xl flex items-center">
                  <span className="text-foreground">
                    {formData.full_name || <span className="text-muted-foreground">Não informado</span>}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Email */}
            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mail
              </label>
              <div className="h-12 px-4 bg-card border border-border rounded-xl flex items-center">
                <span className="text-foreground">{userData?.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
            </motion.div>

            {/* Telefone */}
            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Celular
              </label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  className="h-12 bg-muted/30 border-border"
                  maxLength={15}
                />
              ) : (
                <div className="h-12 px-4 bg-card border border-border rounded-xl flex items-center">
                  <span className="text-foreground">
                    {formData.phone || <span className="text-muted-foreground">Não informado</span>}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Data de Nascimento */}
            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de nascimento
              </label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="h-12 bg-muted/30 border-border"
                />
              ) : (
                <div className="h-12 px-4 bg-card border border-border rounded-xl flex items-center">
                  <span className="text-foreground">
                    {formData.birth_date ? new Date(formData.birth_date).toLocaleDateString("pt-BR") : <span className="text-muted-foreground">Não informado</span>}
                  </span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ProfileDrawer;
