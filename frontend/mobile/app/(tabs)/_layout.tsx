import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, shadows, spacing } from '../../constants/theme';

export default function TabLayout() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.secondary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: fontSize.xs - 1,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="heart"
          options={{
            title: 'Heart Health',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="trends"
          options={{
            title: 'Trends',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'analytics' : 'analytics-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="coach"
          options={{
            title: 'Coach',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'fitness' : 'fitness-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* Persistent Floating Emergency Button accessible directly from all tabs */}
      <TouchableOpacity
        style={styles.floatingEmergencyButton}
        onPress={() => router.push('/emergency')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Emergency 112 Help"
      >
        <Ionicons name="call" size={16} color={colors.textInverse} />
        <Text style={styles.emergencyBtnText}>112 HELP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingEmergencyButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: 74, // positioned right above the bottom tab bar
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    ...shadows.lg,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 999,
  },
  emergencyBtnText: {
    color: colors.textInverse,
    fontWeight: '800',
    fontSize: fontSize.xs,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
});
