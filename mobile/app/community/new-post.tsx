import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import Icon from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

export default function CreatePost() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addPost } = useAppStore();
  const [kind, setKind] = useState<"post" | "reel">("post");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.7 });
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  const submit = () => {
    if (!caption.trim()) return;
    addPost({
      kind,
      caption: caption.trim(),
      image: image || "",
      tags: tags.split(/[,#\s]+/).map((t) => t.trim()).filter(Boolean)
    });
    router.back();
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Create" back />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 80 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>Create Post / Reel</Text>

          <Card>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {(["post", "reel"] as const).map((k) => (
                <Pressable key={k} onPress={() => setKind(k)} style={[styles.tab, { backgroundColor: kind === k ? "rgba(34,211,238,0.15)" : colors.surface2, borderColor: kind === k ? colors.cyan : colors.line }]}>
                  <Text style={{ fontSize: 12, color: kind === k ? colors.ink : colors.muted, fontWeight: "700" }}>{k}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Caption</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
              placeholder="Share your journey: what helped, what blocked you, how you solved it…"
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink, minHeight: 100, textAlignVertical: "top" }]}
            />

            <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Tags</Text>
            <TextInput value={tags} onChangeText={setTags} placeholder="hydration, running, mindset" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]} />

            <Text style={{ fontSize: 12, color: colors.ink, marginTop: space.sm, marginBottom: 4 }}>Media</Text>
            <GradientButton title={image ? "Replace media" : "Pick media"} left={<Icon name="plus" size={14} color={colors.ink} />} variant="ghost" onPress={pick} />
            {image && <Image source={{ uri: image }} style={styles.preview} />}

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: space.md }}>
              <GradientButton title="Publish" onPress={submit} />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
  preview: { width: "100%", aspectRatio: 4 / 3, borderRadius: 12, marginTop: space.sm, backgroundColor: "#000" }
});
