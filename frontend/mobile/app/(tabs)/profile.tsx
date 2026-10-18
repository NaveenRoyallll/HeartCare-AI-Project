import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();

  const [notifications, setNotifications] = useState(user?.preferences?.notificationsEnabled ?? true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(user?.preferences?.emergencyAlertsEnabled ?? true);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of CardioGuard AI?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Medical Telemetry',
      'A consolidated clinical PDF/CSV report of your blood pressure, heart rate, medications, and risk factor trajectory will be compiled and shared.',
      [{ text: 'Download Report', onPress: () => Alert.alert('Success', 'Health summary report prepared.') }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account & Health Records',
      'This will permanently delete your account, patient profile, and all synchronized telemetry data according to health data privacy protocols. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Patient Profile</Text>
          <Text style={styles.pageSubtitle}>Clinical records, emergency contacts, and app preferences</Text>
        </View>

        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.fullName || 'Patient'}</Text>
              <Text style={styles.userContact}>{user?.email || 'Email not provided'}</Text>
              <Text style={styles.userContact}>{user?.phoneNumber || 'Phone not provided'}</Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.userMetricsRow}>
            <View style={styles.userMetricItem}>
              <Text style={styles.metricVal}>{user?.weight ? `${user.weight} kg` : '—'}</Text>
              <Text style={styles.metricLbl}>Weight</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.userMetricItem}>
              <Text style={styles.metricVal}>{user?.height ? `${user.height} cm` : '—'}</Text>
              <Text style={styles.metricLbl}>Height</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.userMetricItem}>
              <Text style={styles.metricVal}>—</Text>
              <Text style={styles.metricLbl}>Age</Text>
            </View>
          </View>
        </Card>

        {/* Emergency Contacts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Contacts (112 & Relatives)</Text>
        </View>

        <Card style={styles.contactCard}>
          {user?.emergencyContacts?.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <View style={styles.contactNameRow}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  {contact.isPrimary && (
                    <Badge label="Primary" status="warning" size="sm" />
                  )}
                </View>
                <Text style={styles.contactDetail}>
                  {contact.relationship} • {contact.phoneNumber}
                </Text>
              </View>
              <Ionicons name="call-outline" size={20} color={colors.secondary} />
            </View>
          ))}
        </Card>

        {/* Clinical Medical History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical History</Text>
        </View>

        <Card style={styles.historyCard}>
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>Diagnosed Conditions</Text>
            <Text style={styles.historyVal}>Hypertension (2021), Dyslipidemia (2023)</Text>
          </View>
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>Known Allergies</Text>
            <Text style={styles.historyVal}>Penicillin</Text>
          </View>
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>Family History of CAD</Text>
            <Text style={styles.historyVal}>Yes (First-degree relative &lt; 55)</Text>
          </View>
          <View style={[styles.historyRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.historyLabel}>Tobacco / Smoking</Text>
            <Text style={styles.historyVal}>Non-smoker</Text>
          </View>
        </Card>

        {/* Connected Medical Devices */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Connected Devices</Text>
        </View>

        <Card style={styles.devicesCard}>
          <View style={styles.deviceItem}>
            <View style={styles.deviceIcon}>
              <Ionicons name="bluetooth" size={20} color={colors.secondary} />
            </View>
            <View style={styles.deviceDetails}>
              <Text style={styles.deviceName}>Omron Evolv BP Monitor</Text>
              <Text style={styles.deviceStatus}>Bluetooth BLE • Synced 3h ago</Text>
            </View>
            <Badge label="Connected" status="normal" size="sm" />
          </View>
        </Card>

        {/* Preferences & Settings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
        </View>

        <Card style={styles.settingsCard}>
          <View style={styles.settingToggleRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Vitals Reminders</Text>
              <Text style={styles.settingSubtitle}>Daily notification to record morning BP</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={(val) => {
                setNotifications(val);
                updateUser({
                  preferences: {
                    ...(user?.preferences || {
                      weightUnit: 'kg',
                      heightUnit: 'cm',
                      bloodPressureUnit: 'mmHg',
                      bloodGlucoseUnit: 'mg/dL',
                      language: 'en',
                      notificationsEnabled: true,
                      emergencyAlertsEnabled: true,
                    }),
                    notificationsEnabled: val,
                  },
                });
              }}
              thumbColor={notifications ? colors.secondary : '#CBD5E1'}
              trackColor={{ true: colors.secondaryLight, false: '#E2E8F0' }}
            />
          </View>

          <View style={styles.settingToggleRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Emergency Alert Broadcast</Text>
              <Text style={styles.settingSubtitle}>Instant SMS alert to primary contact upon 112 trigger</Text>
            </View>
            <Switch
              value={emergencyAlerts}
              onValueChange={(val) => {
                setEmergencyAlerts(val);
                updateUser({
                  preferences: {
                    ...(user?.preferences || {
                      weightUnit: 'kg',
                      heightUnit: 'cm',
                      bloodPressureUnit: 'mmHg',
                      bloodGlucoseUnit: 'mg/dL',
                      language: 'en',
                      notificationsEnabled: true,
                      emergencyAlertsEnabled: true,
                    }),
                    emergencyAlertsEnabled: val,
                  },
                });
              }}
              thumbColor={emergencyAlerts ? colors.secondary : '#CBD5E1'}
              trackColor={{ true: colors.secondaryLight, false: '#E2E8F0' }}
            />
          </View>

          <View style={styles.settingRowSimple}>
            <Text style={styles.settingTitle}>Clinical Units</Text>
            <Text style={styles.settingValue}>kg, cm, mmHg, mg/dL</Text>
          </View>

          <View style={[styles.settingRowSimple, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingTitle}>Language</Text>
            <Text style={styles.settingValue}>English (India)</Text>
          </View>
        </Card>

        {/* Data Export & Account Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Export Medical Telemetry Report (PDF)"
            icon="download-outline"
            variant="outline"
            onPress={handleExportData}
            style={styles.actionBtn}
          />

          <Button
            title="Sign Out"
            icon="log-out-outline"
            variant="ghost"
            onPress={handleLogout}
            style={styles.actionBtn}
          />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteButtonText}>Delete Patient Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  pageTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.primary,
  },
  pageSubtitle: {
    fontSize: fontSize.xs + 1,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  userContact: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  userMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  metricLbl: {
    fontSize: fontSize.xs - 2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  contactCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactInfo: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contactName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  contactDetail: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  historyRow: {
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  historyVal: {
    fontSize: fontSize.xs + 1,
    color: colors.text,
    fontWeight: '500',
    marginTop: 2,
  },
  devicesCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  deviceStatus: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  settingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  settingTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingRowSimple: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingValue: {
    fontSize: fontSize.xs + 1,
    color: colors.secondary,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  actionBtn: {
    marginBottom: spacing.sm,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
