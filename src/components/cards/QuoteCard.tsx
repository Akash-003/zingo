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
  const [areaWidth, setAreaWidth] = useState(0);
  const [areaHeight, setAreaHeight] = useState(0);
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

  // Fit the image inside the available feed area at its real aspect ratio. The
  // resulting rectangle *is* the card: the outer area provides the blank bands
  // for a uniform feed slot, but `cardRef` points at this inner rectangle so
  // view-shot captures only the image (no bands) when sharing / saving.
  const areaAspect = areaHeight > 0 ? areaWidth / areaHeight : FALLBACK_ASPECT;
  let cardW = areaWidth;
  let cardH = areaHeight;
  if (imageAspect > areaAspect) {
    // Image is relatively wider → fills width, blank bands top & bottom.
    cardH = areaWidth / imageAspect;
  } else if (imageAspect < areaAspect) {
    // Image is relatively taller → fills height, blank bands left & right.
    cardW = areaHeight * imageAspect;
  }

  // Slots are positioned relative to the card (image) rectangle directly — no
  // letterbox offset, because the captured view is exactly that rectangle.
  const scale = cardW > 0 ? cardW / CANVAS_WIDTH : 1;
  const ready = areaWidth > 0 && areaHeight > 0;

  const ps = card.photoSlot;
  const ns = card.nameSlot;

  return (
    <View
      style={styles.area}
      onLayout={(e) => {
        setAreaWidth(e.nativeEvent.layout.width);
        setAreaHeight(e.nativeEvent.layout.height);
      }}
    >
      {/* The card itself — sized to the image's real aspect ratio so there are
          no blank bands inside it. This is the view captured for share/save. */}
      <View
        ref={cardRef}
        style={[styles.card, ready ? { width: cardW, height: cardH } : null]}
        collapsable={false}
      >
        {/* Pre-designed card image. The card is sized to the image's aspect
            ratio, so `cover` fills it exactly with no cropping. */}
        <Image
          source={{ uri: card.imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* User photo overlay */}
        {user.primaryPhotoUrl != null && ready && card.supportsPersonalization && ps != null && (
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
        {ready && card.supportsPersonalization && ns != null && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  // Full feed slot. Provides the rounded card surface + blank bands around the
  // centered image; `overflow: hidden` clips the inner card to rounded corners.
  area: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0ede9',
  },
  card: {
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
