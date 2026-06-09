import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { atualizarPerfil } from "@/services/userService";
import { enviarAvatar } from "@/services/storageService";

export default function Perfil() {
  const { profile, userId, logout, refreshProfile } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [email, setEmail] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function obterEmail() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
        }
      } catch (err) {
        console.error("Erro ao obter email:", err);
      }
    }
    obterEmail();
  }, []);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome);
      setImagemUrl(profile.imagem_url);
    }
  }, [profile, isEditing]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } catch (err: any) {
      console.error("Erro ao sair:", err.message);
    } finally {
      setLoggingOut(false);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de permissão para acessar sua galeria de fotos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImagemUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!nome.trim()) {
      setError("O nome não pode ser vazio.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      let finalImagemUrl = profile?.imagem_url ?? null;

      if (imagemUrl && imagemUrl !== profile?.imagem_url) {
        finalImagemUrl = await enviarAvatar(userId, imagemUrl);
      }

      await atualizarPerfil(userId, {
        nome: nome.trim(),
        imagem_url: finalImagemUrl,
      });

      await refreshProfile();
      setIsEditing(false);
    } catch (err: any) {
      console.error("Erro ao atualizar perfil:", err);
      setError(err.message || "Erro ao salvar as informações.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    if (profile) {
      setNome(profile.nome);
      setImagemUrl(profile.imagem_url);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.title}>Perfil</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {isEditing ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePickImage}
                style={styles.avatarEditTouch}
              >
                {imagemUrl ? (
                  <Image source={{ uri: imagemUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={48} color="#303329" />
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={16} color="#303329" />
                </View>
              </TouchableOpacity>
            ) : (
              <View>
                {profile?.imagem_url ? (
                  <Image
                    source={{ uri: profile.imagem_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={48} color="#303329" />
                  </View>
                )}
              </View>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.fieldLabel}>Nome</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Digite seu nome"
                placeholderTextColor="#6B7280"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={saving}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#303329" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#303329" />
                      <Text style={styles.saveText}>Salvar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileDetails}>
              <Text style={styles.name}>{profile?.nome ?? "—"}</Text>
              <Text style={styles.email}>{email ?? "—"}</Text>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="create-outline" size={18} color="#303329" />
                <Text style={styles.editButtonText}>Editar Perfil</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!isEditing && (
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#597317" />
              <Text style={styles.infoLabel}>Membro desde</Text>
              <Text style={styles.infoValue}>
                {profile?.criado_em
                  ? new Date(profile.criado_em).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </Text>
            </View>
          </View>
        )}

        {!isEditing && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <ActivityIndicator color="#DC2626" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                  <Text style={styles.logoutText}>Sair da conta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#a3c267",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#303329",
    marginBottom: 24,
  },
  profileCard: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#d6e6b3",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#597317",
    elevation: 3,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "#303329",
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#c5d79e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#303329",
  },
  avatarEditTouch: {
    position: "relative",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#597317",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#303329",
    elevation: 4,
  },
  profileDetails: {
    alignItems: "center",
    width: "100%",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#303329",
  },
  email: {
    fontSize: 14,
    color: "#35401A",
    marginTop: 4,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#597317",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "100%",
    elevation: 1,
  },
  editButtonText: {
    color: "#303329",
    fontWeight: "bold",
    fontSize: 15,
  },
  editForm: {
    width: "100%",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#303329",
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#303329",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#303329",
    backgroundColor: "#e3f0c4",
    width: "100%",
    marginBottom: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 4,
    marginLeft: 2,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#597317",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    elevation: 1,
  },
  saveText: {
    color: "#303329",
    fontWeight: "bold",
    fontSize: 15,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#303329",
    flex: 1,
  },
  cancelText: {
    color: "#303329",
    fontWeight: "bold",
    fontSize: 15,
  },
  infoSection: {
    backgroundColor: "#d6e6b3",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#597317",
    marginTop: 16,
    padding: 16,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: "#35401A",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#303329",
  },
  actions: {
    marginTop: 24,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    elevation: 1,
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "bold",
    fontSize: 15,
  },
});
