import { RefObject, useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Card } from '../../store/cardsStore';

// Fallback aspect ratio (width / height) used until the real image size loads.
const FALLBACK_ASPECT = 2 / 3;
// Slot coordinates are authored against a 400px-wide canvas.
const CANVAS_WIDTH = 400;

interface QuoteCardProps {
  card: Card;
  user: { primaryPhotoUrl: string | null; name: string };
  cardRef: RefObject<View | null>;
  showWatermark: boolean;
}

export default function QuoteCard({ card, user, cardRef, showWatermark }: QuoteCardProps) {
  const [cardWidth, setCardWidth] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  // Intrinsic aspect ratio (width / height) of the card image; defaults to a
  // fallback ratio until the real size loads.
  const [imageAspect, setImageAspect] = useState(FALLBACK_ASPECT);

  useEffect(() => {
    let active = true;
    Image.getSize(
      card.imageUrl,
      (w, h) => {
        if (active && h > 0) setImageAspect(w / h);
      },
      () => {
        // Fall back to the default ratio if the size can't be read.
        if (active) setImageAspect(FALLBACK_ASPECT);
      }
    );
    return () => {
      active = false;
    };
  }, [card.imageUrl]);

  // The card fills the available area; with resizeMode="contain" the image is
  // centered inside at its real aspect ratio (blank bands fill the rest).
  // Compute that displayed rectangle so the name / photo overlays sit on the
  // actual image, not the blank bands.
  const containerAspect = cardHeight > 0 ? cardWidth / cardHeight : FALLBACK_ASPECT;
  let displayedWidth = cardWidth;
  let displayedHeight = cardHeight;
  let offsetX = 0;
  let offsetY = 0;
  if (imageAspect > containerAspect) {
    // Image is relatively wider → fills width, blank bands top & bottom.
    displayedHeight = cardWidth / imageAspect;
    offsetY = (cardHeight - displayedHeight) / 2;
  } else if (imageAspect < containerAspect) {
    // Image is relatively taller → fills height, blank bands left & right.
    displayedWidth = cardHeight * imageAspect;
    offsetX = (cardWidth - displayedWidth) / 2;
  }

  // Scale slots relative to the displayed image width, then shift by the
  // letterbox offset so they're positioned within the image.
  const scale = displayedWidth > 0 ? displayedWidth / CANVAS_WIDTH : 1;
  const ready = cardWidth > 0 && cardHeight > 0;

  const ps = card.photoSlot;
  const ns = card.nameSlot;

  return (
    <View
      ref={cardRef}
      style={styles.container}
      onLayout={(e) => {
        setCardWidth(e.nativeEvent.layout.width);
        setCardHeight(e.nativeEvent.layout.height);
      }}
      collapsable={false}
    >
      {/* Pre-designed card image — `contain` preserves each image's real
          aspect ratio inside the full-area card (non-matching images get
          blank bands rather than being cropped). */}
      <Image
        source={{ uri: card.imageUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />

      {/* User photo overlay */}
      {user.primaryPhotoUrl != null && ready && card.supportsPersonalization && ps != null && (
        <Image
          source={{ uri: user.primaryPhotoUrl }}
          style={[
            styles.absolute,
            {
              top: offsetY + ps.top * scale,
              left: offsetX + ps.left * scale,
              width: ps.width * scale,
              height: ps.height * scale,
              borderRadius: ps.borderRadius * scale,
            },
          ]}
          resizeMode="cover"
        />
      )}

      {/* User name overlay */}
      {ready && card.supportsPersonalization && ns != null && (
        <Text
          style={[
            styles.absolute,
            styles.nameText,
            {
              top: ns.top !== undefined ? offsetY + ns.top * scale : undefined,
              bottom: ns.bottom !== undefined ? offsetY + ns.bottom * scale : undefined,
              left: ns.left !== undefined ? offsetX + ns.left * scale : undefined,
              right: ns.right !== undefined ? offsetX + ns.right * scale : undefined,
              fontSize: ns.fontSize * scale,
              color: ns.color,
              fontWeight: ns.fontWeight ?? '600',
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
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0ede9',
  },
  absolute: {
    position: 'absolute',
  },
  nameText: {
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
