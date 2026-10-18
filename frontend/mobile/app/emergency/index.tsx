import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function EmergencyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const primaryContact = user?.emergencyContacts?.find((c) => c.isPrimary) || user?.emergencyContacts?.[0];

  const handleCall112 = () => {
    Alert.alert(
      'Call 112 now?',
      'This will open your phone dialer for India’s emergency number. The app cannot confirm that the call was answered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 112',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:112').catch(() => {
            Alert.alert(
              'Call 112',
              'Could not open the dialer. Please dial 112 immediately on your phone keypad.'
            );
          }),
        },
      ],
    );
  };

  const handleCallEmergencyContact = () => {
    if (primaryContact?.phoneNumber) {
      const cleanPhone = primaryContact.phoneNumber.replace(/[^0-9+]/g, '');
      Linking.openURL(`tel:${cleanPhone}`).catch(() => {
        Alert.alert(
          'Emergency Contact',
          `Could not dial automatically. Please dial ${primaryContact.name} at ${primaryContact.phoneNumber}.`
        );
      });
    } else {
      Alert.alert(
        'No Emergency Contact',
        'No emergency contact registered. Please dial 112 directly for immediate medical emergency services.'
      );
    }
  };

  const warningSigns = [
    {
      icon: 'warning' as const,
      title: 'Chest Pain or Discomfort',
      desc: 'Pressure, tightness, fullness, squeezing, or burning in the center of the chest.',
    },
    {
      icon: 'fitness' as const,
      title: 'Radiating Pain',
      desc: 'Discomfort spreading to the left arm, shoulders, neck, jaw, or upper back.',
    },
    {
      icon: 'water' as const,
      title: 'Shortness of Breath & Cold Sweats',
      desc: 'Difficulty catching breath, sudden unexplained profuse cold sweating.',
    },
    {
      icon: 'warning' as const,
      title: 'Dizziness or Fainting',
      desc: 'Lightheadedness, loss of balance, or sudden profound fatigue.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Close / Return Navigation */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Back to main app"
        >
          <Ionicons name="close" size={28} color={colors.textInverse} />
        </TouchableOpacity>

        {/* Large Emergency Header */}
        <View style={styles.header}>
          <View style={styles.alertIconCircle}>
            <Ionicons name="warning" size={42} color={colors.danger} />
          </View>
          <Text style={styles.headerTitle}>EMERGENCY HELP</Text>
          <Text style={styles.headerSubtitle}>
            Are you or someone near you experiencing a possible heart emergency?
          </Text>
        </View>

        {/* PROMINENT CALL 112 BUTTON */}
        <TouchableOpacity
          style={styles.call112Button}
          onPress={handleCall112}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Call 112 National Emergency Hotline"
        >
          <Ionicons name="call" size={36} color={colors.textInverse} style={styles.callIcon} />
          <View>
            <Text style={styles.call112Text}>CALL 112 IMMEDIATELY</Text>
            <Text style={styles.call112Subtext}>National Emergency Medical Response (India)</Text>
          </View>
        </TouchableOpacity>

        {/* Secondary Action: Call Emergency Contact */}
        {primaryContact && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleCallEmergencyContact}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactTitle}>Call Primary Contact</Text>
              <Text style={styles.contactSubtitle}>
                {primaryContact.name} ({primaryContact.relationship}): {primaryContact.phoneNumber}
              </Text>
            </View>
            <Ionicons name="call" size={20} color={colors.secondary} />
          </TouchableOpacity>
        )}

        {/* Symptom Checker CTA */}
        <TouchableOpacity
          style={styles.symptomsButton}
          onPress={() => router.push('/emergency/symptoms')}
          activeOpacity={0.8}
        >
          <Ionicons name="clipboard-outline" size={22} color={colors.textInverse} />
          <Text style={styles.symptomsButtonText}>I'm Experiencing Symptoms — Check Warning Signs</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
        </TouchableOpacity>

        {/* Critical Cardiac Warning Signs */}
        <View style={styles.warningSection}>
          <Text style={styles.sectionTitle}>Cardiac Emergency Warning Signs</Text>
          <Text style={styles.sectionSub}>
            If you notice ANY of these signs, do NOT hesitate. Call 112 immediately.
          </Text>

          {warningSigns.map((sign, index) => (
            <View key={index} style={styles.warningItem}>
              <View style={styles.warningIconBox}>
                <Ionicons name={sign.icon} size={22} color={colors.danger} />
              </View>
              <View style={styles.warningTextGroup}>
                <Text style={styles.warningTitle}>{sign.title}</Text>
                <Text style={styles.warningDesc}>{sign.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Life-Saving Guidance Steps */}
        <View style={styles.guidanceCard}>
          <Text style={styles.guidanceHeader}>What To Do While Help Is On The Way:</Text>
          <Text style={styles.guidanceStep}>1. Stop exertion. Sit in a comfortable supported position and stay with the person.</Text>
          <Text style={styles.guidanceStep}>2. Call 112 and follow the dispatcher’s instructions. Share the location and symptoms.</Text>
          <Text style={styles.guidanceStep}>3. Do not let the person drive. Do not give food, drink, or unprescribed medicines.</Text>
          <Text style={styles.guidanceStep}>4. Only use prescribed medicines as directed by a qualified clinician or dispatcher.</Text>
          <Text style={styles.guidanceStep}>5. If unresponsive and not breathing normally or only gasping, call 112, start CPR as directed, and use an AED if available.</Text>
          <Text style={styles.guidanceStep}>6. If unconscious but breathing normally, monitor breathing and follow dispatcher instructions. Give nothing by mouth.</Text>
        </View>

        {/* Mandatory Safety Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Ionicons name="alert-circle" size={20} color="#F87171" />
          <Text style={styles.disclaimerText}>
            DISCLAIMER: This application cannot diagnose a heart attack, cardiac arrest, or acute coronary syndrome. If you suspect an emergency, call 112 immediately. Every minute matters.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7F1D1D', // Deep emergency red header background
  },
  scrollContent: {
    backgroundColor: '#991B1B',
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  alertIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.lg,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '900',
    color: colors.textInverse,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: '#FEE2E2',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 320,
  },
  call112Button: {
    backgroundColor: '#EF4444',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  callIcon: {
    marginRight: spacing.md,
  },
  call112Text: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  call112Subtext: {
    color: '#FEE2E2',
    fontSize: fontSize.xs,
    marginTop: 2,
    fontWeight: '600',
  },
  contactButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  contactTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  contactTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  contactSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  symptomsButton: {
    backgroundColor: '#B91C1C',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  symptomsButtonText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: fontSize.xs + 1,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  warningSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.danger,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  warningIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  warningTextGroup: {
    flex: 1,
  },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  warningDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  guidanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  guidanceHeader: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  guidanceStep: {
    fontSize: fontSize.xs,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  disclaimerText: {
    color: '#FEE2E2',
    fontSize: fontSize.xs - 1,
    lineHeight: 16,
    flex: 1,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
});
