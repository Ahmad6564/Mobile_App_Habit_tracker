import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import { palette, space, typography } from "../../src/theme";

export default function JourneyNew() {
  const router = useRouter();
  const [challenge, setChallenge] = useState("");
  const [helped, setHelped] = useState("");
  const [remained, setRemained] = useState("");

  const save = () => {
    Alert.alert("Saved", "Your journey log has been saved locally.");
    router.back();
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Journey" back />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 80 }}>
          <Text style={typography.h1}>Write Journey Log</Text>
          <Text style={typography.muted}>Tell your story so it helps others starting the same habit.</Text>

          <Card>
            <Field label="What challenge did you face?" value={challenge} onChange={setChallenge} placeholder="Example: I couldn't wake up early for my run..." />
            <Field label="What helped you improve?" value={helped} onChange={setHelped} placeholder="Example: I prepared shoes and clothes at night." />
            <Field label="What problem remained, and how did you overcome it?" value={remained} onChange={setRemained} placeholder="Share your practical fix for others." />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: space.md }}>
              <GradientButton title="Save Journey" onPress={save} />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={{ marginTop: space.sm }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        multiline
        numberOfLines={3}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.small, color: palette.ink, marginBottom: 4 },
  input: {
    backgroundColor: palette.surface2, borderColor: palette.line, borderWidth: StyleSheet.hairlineWidth,
    color: palette.ink, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10,
    minHeight: 80, textAlignVertical: "top"
  }
});
