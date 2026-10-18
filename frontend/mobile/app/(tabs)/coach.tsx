import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize, shadows } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function CoachScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'assistant',
      text: 'Namaste! I am your CardioGuard AI Health Coach. How can I help you support your cardiovascular wellness today?',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    'Heart-healthy Indian breakfast options',
    'Tips to reduce dietary salt in dal & curry',
    'Safe exercises for mild hypertension',
    'How does sleep affect heart rate variability?',
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = 'Thank you for your question. Maintaining consistent physical activity and managing dietary sodium are cornerstones of cardiovascular wellness.';
      const lower = text.toLowerCase();

      if (lower.includes('breakfast') || lower.includes('food') || lower.includes('diet')) {
        reply = 'For an Indian cardiovascular-friendly breakfast, consider:\n• Oats or Vegetable Upma with minimal oil\n• Moong Dal Chilla stuffed with spinach (palak)\n• Idli with vegetable sambar (prepared with low sodium, plenty of drumsticks/bottle gourd)\n• Avoid deep-fried items like puri, medu vada, or parathas cooked with vanaspati.';
      } else if (lower.includes('salt') || lower.includes('sodium') || lower.includes('dal')) {
        reply = 'To lower sodium intake in Indian cooking:\n• Season with lemon juice, amchur, cumin, and coriander instead of excess table salt\n• Avoid papad, commercial pickles (achar), and processed chutneys\n• Aim for less than 1 level teaspoon (2,000 mg sodium) of total added salt per day across all family meals.';
      } else if (lower.includes('exercise') || lower.includes('walk') || lower.includes('hypertension')) {
        reply = 'For cardiovascular conditioning with blood pressure:\n• Aim for 30 minutes of brisk walking 5 days a week\n• Always include a 5-minute warm-up and cool-down\n• Avoid heavy isometric straining (e.g. max heavy leg press) without physician clearance\n• Stop immediately and seek medical care if you experience chest tightness, dizziness, or nausea.';
      } else if (lower.includes('sleep')) {
        reply = 'Quality restorative sleep (7–8 hours) reduces sympathetic nervous system tone and helps normalize nocturnal blood pressure dipping. Maintain a regular sleep schedule and avoid screens 45 minutes before bedtime.';
      }

      const assistantMsg: ChatMessage = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        text: reply,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Cardio Lifestyle Coach</Text>
            <Text style={styles.pageSubtitle}>
              Evidence-based habit coaching & Indian cardiovascular dietary guidance
            </Text>
          </View>

          {/* Daily Heart Tip */}
          <Card style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <View style={styles.tipIconBadge}>
                <Ionicons name="bulb-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.tipTitle}>Today's Heart Wisdom</Text>
            </View>
            <Text style={styles.tipText}>
              "Substituting refined cooking oils and vanaspati with moderate amounts of mustard or cold-pressed sesame oil along with high-fiber soluble grains like barley and oats helps lower circulating LDL particles."
            </Text>
          </Card>

          {/* Activity Goals Card */}
          <Card style={styles.goalsCard}>
            <Text style={styles.cardHeading}>Cardiovascular Activity Goals</Text>
            <View style={styles.goalRow}>
              <View style={styles.goalItem}>
                <Ionicons name="footsteps-outline" size={24} color={colors.secondary} />
                <Text style={styles.goalValue}>6,420 / 8,000</Text>
                <Text style={styles.goalLabel}>Steps Taken</Text>
              </View>
              <View style={styles.goalDivider} />
              <View style={styles.goalItem}>
                <Ionicons name="flame-outline" size={24} color="#EA580C" />
                <Text style={styles.goalValue}>28 / 30 min</Text>
                <Text style={styles.goalLabel}>Aerobic Active Time</Text>
              </View>
              <View style={styles.goalDivider} />
              <View style={styles.goalItem}>
                <Ionicons name="moon-outline" size={24} color="#6366F1" />
                <Text style={styles.goalValue}>7.2 hrs</Text>
                <Text style={styles.goalLabel}>Restful Sleep</Text>
              </View>
            </View>
          </Card>

          {/* Nutrition Guidance (Indian Foods Focus) */}
          <Card style={styles.nutritionCard}>
            <View style={styles.nutritionHeader}>
              <Ionicons name="restaurant-outline" size={20} color={colors.secondary} />
              <Text style={styles.cardHeading}>Heart-Smart Indian Nutrition</Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionTitle}>1. Whole Grains & Millets</Text>
              <Text style={styles.nutritionDesc}>
                Incorporate Jowar, Bajra, and Ragi rotis alongside brown rice to boost soluble fiber and stabilize glucose.
              </Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionTitle}>2. Sodium Reduction in Dal & Sabzi</Text>
              <Text style={styles.nutritionDesc}>
                Limit tadka with excessive ghee. Replace extra salt with freshly squeezed nimbu (lemon), ginger, and roasted jeera.
              </Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionTitle}>3. Green Leafy Vegetables (Saag)</Text>
              <Text style={styles.nutritionDesc}>
                Spinach (palak), fenugreek (methi), and moringa (drumstick leaves) are rich in dietary nitrates that support vascular elasticity.
              </Text>
            </View>
          </Card>

          {/* AI Health Assistant Section */}
          <View style={styles.chatSectionHeader}>
            <View style={styles.chatTitleRow}>
              <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
              <Text style={styles.chatSectionTitle}>CardioGuard AI Assistant</Text>
            </View>
            <Badge label="Online" status="normal" size="sm" />
          </View>

          {/* Quick Query Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScrollView}
          >
            {quickQuestions.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chip}
                onPress={() => handleSend(q)}
              >
                <Text style={styles.chipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chat Messages */}
          <View style={styles.chatBox}>
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.messageBubble,
                  m.sender === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    m.sender === 'user' ? styles.userMessageText : styles.assistantMessageText,
                  ]}
                >
                  {m.text}
                </Text>
              </View>
            ))}

            {isTyping && (
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={styles.typingText}>CardioGuard is analyzing...</Text>
              </View>
            )}
          </View>

          {/* Input Row */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask a question about heart health, diet..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? colors.textInverse : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimerText}>
            AI recommendations are educational and do not constitute formal medical diagnosis or prescription.
          </Text>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
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
  tipCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tipIconBadge: {
    marginRight: spacing.xs,
  },
  tipTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#92400E',
  },
  tipText: {
    fontSize: fontSize.xs + 1,
    color: '#78350F',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  goalsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeading: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalItem: {
    alignItems: 'center',
    flex: 1,
  },
  goalValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  goalLabel: {
    fontSize: fontSize.xs - 2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  goalDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  nutritionCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nutritionItem: {
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    paddingBottom: spacing.xs,
  },
  nutritionTitle: {
    fontSize: fontSize.xs + 1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  nutritionDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  chatSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  chatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  chipScrollView: {
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    ...shadows.sm,
  },
  chipText: {
    fontSize: fontSize.xs,
    color: colors.secondary,
    fontWeight: '500',
  },
  chatBox: {
    marginBottom: spacing.sm,
  },
  messageBubble: {
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  messageText: {
    fontSize: fontSize.xs + 1,
    lineHeight: 18,
  },
  userMessageText: {
    color: colors.textInverse,
  },
  assistantMessageText: {
    color: colors.text,
  },
  typingText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  chatInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.secondary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  disclaimerText: {
    fontSize: fontSize.xs - 2,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: spacing.xs,
  },
});
