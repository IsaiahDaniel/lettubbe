import React from 'react';
import { View, StyleSheet, FlatList, StyleProp, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

const SkeletonBox = ({ style }: { style: StyleProp<ViewStyle> }) => (
  <MotiView
    style={[style, { backgroundColor: '#e0e0e0' }]}
    from={{ opacity: 0.3 }}
    animate={{ opacity: 1 }}
    transition={{
      loop: true,
      type: 'timing',
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    }}
  />
);

const SkeletonCommentSection = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerContainer}>
        <View style={styles.sortContainer}>
          {[...Array(4)].map((_, i) => (
            <SkeletonBox key={i} style={styles.sortButton} />
          ))}
          <SkeletonBox style={styles.searchIcon} />
        </View>
      </View>

      {/* Comments Skeleton */}
      <View style={styles.scrollableContent}>
        <FlatList
          data={[1]} 
          keyExtractor={(item) => item.toString()}
          renderItem={() => (
            <View style={styles.commentItem}>
              <SkeletonBox style={styles.avatar} />
              <View style={styles.commentContent}>
                <SkeletonBox style={styles.commentLineShort} />
                <SkeletonBox style={styles.commentLineLong} />
              </View>
            </View>
          )}
        />
      </View>

      {/* Footer Skeleton */}
      <View style={styles.footerContainer}>
        <View style={styles.inputContainer}>
          <SkeletonBox style={styles.inputField} />
          <SkeletonBox style={styles.sendButton} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  headerContainer: {
    marginBottom: 20,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  sortButton: {
    width: 60,
    height: 27,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  searchIcon: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
  },
  scrollableContent: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentLineShort: {
    width: '50%',
    height: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  commentLineLong: {
    width: '80%',
    height: 10,
    borderRadius: 4,
  },
  footerContainer: {
    paddingVertical: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputField: {
    flex: 1,
    height: 40,
    borderRadius: 6,
  },
  sendButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});

export default SkeletonCommentSection;