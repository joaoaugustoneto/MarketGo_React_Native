import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
}

export function StarRating({
  rating,
  onRate,
  size = 32,
  readOnly = false,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {stars.map((star) => {
        const isFilled = star <= rating;
        const iconName = isFilled ? 'star' : 'star-outline';
        const color = isFilled ? '#F59E0B' : '#94A3B8';

        if (readOnly || !onRate) {
          return (
            <View key={star} style={styles.star}>
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        }

        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`${star} estrela${star > 1 ? 's' : ''}`}
            onPress={() => onRate(star)}
            style={({ pressed }) => [styles.star, pressed && styles.pressed]}
          >
            <Ionicons name={iconName} size={size} color={color} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  star: {
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 1.15 }],
  },
});
