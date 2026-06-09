import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Image } from "expo-image";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import type { MembroComPerfil } from "@/services/membroService";

type Props = {
  visible: boolean;
  onClose: () => void;
  members: MembroComPerfil[];
  currentUserId?: string;
  isCreator: boolean;
  onInvite: () => void;
  onRemoveMember: (id: string) => void;
  onDeleteGroup: () => void;
};

export default function GroupMenuModal({
  visible,
  onClose,
  members,
  currentUserId,
  isCreator,
  onInvite,
  onRemoveMember,
  onDeleteGroup,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Grupo</Text>

          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#303329" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={members}
          keyExtractor={(item) => item.usuario.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Membros</Text>}
          renderItem={({ item: member }) => (
            <View style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Image
                  source={
                    member.usuario.imagem_url ??
                    "https://via.placeholder.com/100"
                  }
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                />

                <View>
                  <Text style={styles.memberName}>{member.usuario.nome}</Text>

                  {member.usuario.id === currentUserId && (
                    <Text style={styles.youText}>Você</Text>
                  )}
                </View>
              </View>

              {isCreator && member.usuario.id !== currentUserId && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Remover membro",
                      `Deseja remover ${member.usuario.nome} do grupo?`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Remover",
                          style: "destructive",
                          onPress: () => onRemoveMember(member.usuario_id),
                        },
                      ],
                    )
                  }
                >
                  <Ionicons name="trash-outline" size={22} color="#B00020" />
                </TouchableOpacity>
              )}
            </View>
          )}
          ListFooterComponent={
            isCreator ? (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onInvite}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={22}
                    color="#303329"
                  />

                  <Text style={styles.actionText}>Convidar amigo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    Alert.alert(
                      "Apagar grupo",
                      "Esta ação não pode ser desfeita.",
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Apagar",
                          style: "destructive",
                          onPress: onDeleteGroup,
                        },
                      ],
                    )
                  }
                >
                  <Ionicons name="trash-outline" size={22} color="#fff" />

                  <Text style={styles.deleteText}>Apagar grupo</Text>
                </TouchableOpacity>
              </>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A3C267",
  },

  header: {
    height: 70,
    backgroundColor: "#597317",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#303329",
  },

  content: {
    padding: 20,
    paddingBottom: 60,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#303329",
    marginBottom: 20,
  },

  memberRow: {
    backgroundColor: "#D7E4B3",

    borderRadius: 16,

    padding: 14,
    marginBottom: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderWidth: 1,
    borderColor: "#597317",
  },

  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,

    marginRight: 14,

    backgroundColor: "#597317",
  },

  memberName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#303329",
  },

  youText: {
    marginTop: 2,
    color: "#4B5320",
    fontSize: 13,
  },

  actionButton: {
    height: 56,

    backgroundColor: "#D7E4B3",

    borderRadius: 16,

    marginTop: 24,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#597317",
  },

  actionText: {
    marginLeft: 10,

    fontSize: 16,
    fontWeight: "bold",

    color: "#303329",
  },

  deleteButton: {
    height: 56,

    backgroundColor: "#B00020",

    borderRadius: 16,

    marginTop: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    marginLeft: 10,

    fontSize: 16,
    fontWeight: "bold",

    color: "#fff",
  },
});
