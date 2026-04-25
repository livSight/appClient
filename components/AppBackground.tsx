import React from "react";
import { StyleSheet, View } from "react-native";
import HeroGridBackground from "./HeroGridBackground";

type Props = {
  children: React.ReactNode;
  opacity?: number;
};

export default function AppBackground({ children, opacity = 0.12 }: Props) {
  return (
    <View style={styles.root}>
      <HeroGridBackground opacity={opacity} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "white",
  },
});

