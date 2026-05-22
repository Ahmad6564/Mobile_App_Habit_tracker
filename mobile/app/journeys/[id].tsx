import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Header from "../../src/components/Header";
import Card from "../../src/components/Card";
import { space, typography } from "../../src/theme";

export default function JourneyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <Header title="Journey" back />
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
          <Text style={typography.eyebrow}>Journey #{id}</Text>
          <Card>
            <Text style={typography.h2}>How I fixed my consistency problem in 3 weeks</Text>
            <Text style={[typography.body, { marginTop: space.sm }]}>
              I failed my morning habit repeatedly because I depended on motivation. The game changer was reducing friction:
              one visible trigger, one tiny first action, and one accountability post every night.
            </Text>
            <Text style={[typography.body, { marginTop: space.sm }]}>
              Biggest blocker: overplanning. Biggest win: keeping score daily and sharing short proof in community posts.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
