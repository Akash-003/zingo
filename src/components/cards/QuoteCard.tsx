import { RefObject, useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import ImageColors from 'react-native-image-colors';
import { Card } from '../../store/cardsStore';

const FALLBACK_ASPECT = 2 / 3;
const CANVAS_WIDTH = 400;
const STRIP_HEIGHT = 52;

interface QuoteCardProps {
  card: Card;
  user: { primaryPhotoUrl: string | null; name: string };
  cardRef: RefObject<View | null>;
  showWatermark: boolean;
}

export default function QuoteCard({ card, user, cardRef, showWatermark }: QuoteCardProps) {
  const [areaWidth, setAreaWidth] = useState(0);
  const [areaHeight, setAreaHeight] = useState(0);
  const [stripBg, setStripBg] = useState('#1c1c19');
  const [stripTextDark, setStripTextDark] = useState(false);
  const [imageAspect, setImageAspect] = useState(FALLBACK_ASPECT);

  useEffect(() => {
    let active = true;
    Image.getSize(
      card.imageUrl,
      (w, h) => { if (active && h > 0) setImageAspect(w / h); },
      () => { if (active) setImageAspect(FALLBACK_ASPECT); }
    );
    return () => { active = false; };
  }, [card.imageUrl]);

  useEffect(() => {
    let active = true;
    ImageColors.getColors(card.imageUrl, { fallback: '#1c1c19', cache: true, key: card.imageUrl }).then(
      (result) => {
        if (!active) return;
        const hex =
          result.platform === 'android' ? result.dominant :
          result.platform === 'ios' ? result.background :
          result.platform === 'web' ? result.dominant :
          '#1c1c19';
        const color = hex ?? '#1c1c19';
        setStripBg(color);
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        setStripTextDark((0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55);
      }
    );
    return () => { active = false; };
  }, [card.imageUrl]);

  const ps = card.photoSlot;
  const ns = card.nameSlot;
  const showStrip = card.supportsPersonalization && ns == null && !!user.name;

  // Fit card to area using real image aspect ratio.
  const areaAspect = areaHeight > 0 ? areaWidth / areaHeight : FALLBACK_ASPECT;
  let cardW = areaWidth;
  let cardH = areaHeight;
  if (imageAspect > areaAspect) {
    cardH = areaWidth / imageAspect;
  } else if (imageAspect < areaAspect) {
    cardW = areaHeight * imageAspect;
    cardH = areaHeight;
  }

  // When the strip shows and the card would fill the full area height, shrink it
  // so cardGroup (card + strip) fits exactly inside the area with no overflow.
  if (showStrip && cardH > areaHeight - STRIP_HEIGHT) {
    const maxH = areaHeight - STRIP_HEIGHT;
    cardH = maxH;
    cardW = maxH * imageAspect;
  }

  const scale = cardW > 0 ? cardW / CANVAS_WIDTH : 1;
  const ready = areaWidth > 0 && areaHeight > 0;

  return (
    <View
      style={styles.area}
      onLayout={(e) => {
        setAreaWidth(e.nativeEvent.layout.width);
        setAreaHeight(e.nativeEvent.layout.height);
      }}
    >
      {/* cardGroup is centered as a unit — strip sits flush below image, no gap */}
      <View style={styles.cardGroup}>
        <View
          ref={cardRef}
          style={[styles.card, ready ? { width: cardW, height: cardH } : null]}
          collapsable={false}
        >
          <Image source={{ uri: card.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />

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
                  borderRadius: (Math.min(ps.width, ps.height) * scale) / 2,
                },
              ]}
              resizeMode="cover"
            />
          )}

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

          {showWatermark && (
            <View style={styles.watermark} pointerEvents="none">
              <Text style={styles.watermarkText}>Made with Zingo</Text>
            </View>
          )}
        </View>

        {ready && showStrip && (
          <View style={[styles.nameStrip, { width: cardW, backgroundColor: stripBg }]}>
            <Text style={[styles.nameStripText, { color: stripTextDark ? '#1c1c19' : '#ffffff' }]} numberOfLines={1}>
              {user.name}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0ede9',
  },
  cardGroup: {
    alignItems: 'center',
  },
  card: {
    overflow: 'hidden',
    backgroundColor: '#f0ede9',
  },
  nameStrip: {
    height: STRIP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameStripText: {
    fontFamily: 'DancingScript_700Bold',
    fontSize: 26,
    lineHeight: 52,
    letterSpacing: 0.5,
    includeFontPadding: false,
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
