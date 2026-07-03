import React, { useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
import { PostFormat, useAppStore } from "../../src/store/useAppStore";

const FORMAT_OPTIONS: Array<{ id: PostFormat; label: string; icon: string }> = [
  { id: "text", label: "Text", icon: "text" },
  { id: "video", label: "Video", icon: "video" },
  { id: "gallery", label: "Gallery", icon: "gallery" }
];

export default function CreatePost() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addPost } = useAppStore();
  const [format, setFormat] = useState<PostFormat>("text");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [song, setSong] = useState("");
  const [media, setMedia] = useState<string[]>([]);

  const mediaLabel = useMemo(() => {
    if (format === "video") return media.length ? "Replace video" : "Pick video";
    if (format === "gallery") return media.length ? "Add more photos" : "Pick photos";
    return "";
  }, [format, media.length]);

  const pickVideo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.8
    });
    if (!res.canceled) {
      setMedia([res.assets[0].uri]);
    }
  };

  const pickGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8
    });
    if (!res.canceled) {
      setMedia((prev) => {
        const next = [...prev, ...res.assets.map((a) => a.uri)];
        return Array.from(new Set(next)).slice(0, 10);
      });
    }
  };

  const onPickMedia = async () => {
    if (format === "video") {
      await pickVideo();
      return;
    }
    if (format === "gallery") {
      await pickGallery();
    }
  };

  const removeMedia = (uri: string) => {
    setMedia((prev) => prev.filter((m) => m !== uri));
  };

  const submit = () => {
    if (!caption.trim()) {
      Alert.alert("Caption required", "Please add text before publishing.");
      return;
    }
    if (format !== "text" && media.length === 0) {
      Alert.alert("Media required", "Please add media for this post type.");
      return;
    }

    addPost({
      kind: format === "video" ? "reel" : "post",
      format,
      media,
      image: media[0] || "",
      song: format === "text" ? "" : song.trim(),
      caption: caption.trim(),
      tags: tags.split(/[,#\s]+/).map((t) => t.trim()).filter(Boolean)
    });
    router.back();
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="New Post" back />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 90 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: colors.ink }}>Create</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Share as text, video, or photo carousel</Text>
          </View>

          <Card>
            <View style={styles.formatRow}>
              {FORMAT_OPTIONS.map((opt) => {
                const active = format === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      setFormat(opt.id);
                      setMedia([]);
                      if (opt.id === "text") setSong("");
                    }}
                    style={[
                      styles.formatChip,
                      {
                        backgroundColor: active ? "rgba(34,211,238,0.16)" : colors.surface2,
                        borderColor: active ? colors.cyan : colors.line
                      }
                    ]}
                  >
                    <Icon name={opt.icon} size={16} color={active ? colors.cyan : colors.muted} />
                    <Text style={{ fontSize: 12, fontWeight: "800", color: active ? colors.ink : colors.muted }}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Caption</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={5}
              placeholder="What happened today? Share the story behind your progress..."
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.line,
                  color: colors.ink,
                  minHeight: 120,
                  textAlignVertical: "top"
                }
              ]}
            />

            <Text style={styles.label}>Tags</Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="fitness, hydration, mindset"
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
            />

            {format !== "text" && (
              <>
                <Text style={styles.label}>Media</Text>
                <GradientButton
                  title={mediaLabel}
                  left={<Icon name="plus" size={14} color={colors.ink} />}
                  variant="ghost"
                  onPress={onPickMedia}
                />

                {format === "video" && media[0] ? (
                  <View style={styles.videoPreview}>
                    <Image source={{ uri: media[0] }} style={styles.videoImage} />
                    <View style={styles.playBadge}>
                      <Icon name="play" size={26} color="#fff" />
                    </View>
                    <Pressable onPress={() => removeMedia(media[0])} style={styles.removeBtn}>
                      <Icon name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ) : null}

                {format === "gallery" && media.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 8 }}>
                    {media.map((uri) => (
                      <View key={uri} style={styles.galleryItem}>
                        <Image source={{ uri }} style={styles.galleryImage} />
                        <Pressable onPress={() => removeMedia(uri)} style={styles.removeBtn}>
                          <Icon name="close" size={14} color="#fff" />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <Text style={styles.label}>Song (optional)</Text>
                <TextInput
                  value={song}
                  onChangeText={setSong}
                  placeholder="Song title - Artist"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
                />
              </>
            )}

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: space.lg }}>
              <GradientButton title="Publish" onPress={submit} />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  formatRow: { flexDirection: "row", gap: 8 },
  formatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth
  },
  label: { fontSize: 12, fontWeight: "700", marginTop: space.sm, marginBottom: 4 },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
  videoPreview: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    aspectRatio: 9 / 16,
    backgroundColor: "#000"
  },
  videoImage: { width: "100%", height: "100%" },
  playBadge: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  galleryItem: { width: 120, height: 160, borderRadius: 12, overflow: "hidden", position: "relative", backgroundColor: "#000" },
  galleryImage: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center"
  }
});
