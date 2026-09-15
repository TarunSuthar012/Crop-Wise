import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

export default function Badge({ label, tone = 'muted' }) {
  const style =
    tone === 'accent'
      ? { backgroundColor: '#103126', color: colors.accent }
      : tone === 'warn'
      ? { backgroundColor: '#2A2216', color: colors.warn }
      : { backgroundColor: '#1A3327', color: colors.textMuted }

  return (
    <View style={[styles.badge, { backgroundColor: style.backgroundColor }]}>
      <Text style={[styles.text, { color: style.color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
})
