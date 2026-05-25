import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  nome: string;
  imagem?: string | null;
  onPress?: () => void;
};

export default function GroupCard({ nome, imagem, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{
          uri: imagem || "https://via.placeholder.com/100",
        }}
        style={styles.image}
      />

      <View style={styles.info}>
        <Text style={styles.name}>{nome}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#d6e6b3",

    padding: 14,
    marginBottom: 14,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: "#597317",

    elevation: 3,
  },

  image: {
    width: 64,
    height: 64,

    borderRadius: 32,

    backgroundColor: "#597317",

    borderWidth: 2,
    borderColor: "#35401A",
  },

  info: {
    marginLeft: 14,
    flex: 1,
    justifyContent: "center",
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#303329",
  },
});
