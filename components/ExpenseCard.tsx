import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  descricao: string;
  valor: number;
  nomePagador: string;
  avatarPagador?: string | null;
  recibo?: string | null;
};

export default function ExpenseCard({
  descricao,
  valor,
  nomePagador,
  avatarPagador,
  recibo,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{
              uri: avatarPagador || "https://via.placeholder.com/100",
            }}
            style={styles.avatar}
          />

          <View style={styles.headerInfo}>
            <Text style={styles.description}>{descricao}</Text>

            <Text style={styles.user}>Pago por {nomePagador}</Text>
          </View>
        </View>
        <View style={styles.content}>
          {recibo && (
            <Pressable onPress={() => setModalVisible(true)}>
              <Image
                source={{ uri: recibo }}
                style={styles.receipt}
                resizeMode="cover"
              />
            </Pressable>
          )}

          <Text style={styles.value}>R$ {valor.toFixed(2)}</Text>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalContainer}
          onPress={() => setModalVisible(false)}
        >
          <Image
            source={{ uri: recibo! }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#D7E4B3",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#597317",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 14,
    paddingHorizontal: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#597317",
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  description: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#303329",
  },
  user: {
    marginTop: 2,
    color: "#4B5320",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  receipt: {
    borderRadius: 12,
    width: 128,
    height: 128,
    backgroundColor: "#ccc",
  },
  value: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#597317",
    padding: 16,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },

  fullImage: {
    width: "95%",
    height: "85%",
  },
});
