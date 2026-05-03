import { RefObject, useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Card } from '../../store/cardsStore';

interface QuoteCardProps {
  card: Card;
  user: { primaryPhotoUrl: string | null; name: string };
  cardRef: RefObject<View | null>;
  showWatermark: boolean;
}

export default function QuoteCard({ card, user, cardRef, showWatermark }: QuoteCardProps) {
  const [cardWidth, setCardWidth] = useState(0);
  const scale = cardWidth > 0 ? cardWidth / 400 : 1;

  const ps = card.photoSlot;
  const ns = card.nameSlot;

  return (
    <View
      ref={cardRef}
      style={styles.container}
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      collapsable={false}
    >
      {/* Pre-designed card image */}
      <Image
        source={{ uri: card.imageUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* User photo overlay */}
      {user.primaryPhotoUrl != null && cardWidth > 0 && (
        <Image
          source={{ uri: user.primaryPhotoUrl }}
          style={[
            styles.absolute,
            {
              top: ps.top * scale,
              left: ps.left * scale,
              width: ps.width * scale,
              height: ps.height * scale,
              borderRadius: ps.borderRadius * scale,
            },
          ]}
          resizeMode="cover"
        />
      )}

      {/* User name overlay */}
      {cardWidth > 0 && (
        <Text
          style={[
            styles.absolute,
            styles.nameText,
            {
              top: ns.top !== undefined ? ns.top * scale : undefined,
              bottom: ns.bottom !== undefined ? ns.bottom * scale : undefined,
              left: ns.left !== undefined ? ns.left * scale : undefined,
              right: ns.right !== undefined ? ns.right * scale : undefined,
              fontSize: ns.fontSize * scale,
              color: ns.color,
            },
          ]}
          numberOfLines={1}
        >
          {user.name}
        </Text>
      )}

      {/* Watermark for free users */}
      {showWatermark && (
        <View style={styles.watermark} pointerEvents="none">
          <Text style={styles.watermarkText}>Made with QuoteFlow</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0ede9',
  },
  absolute: {
    position: 'absolute',
  },
  nameText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  watermark: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  watermarkText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
