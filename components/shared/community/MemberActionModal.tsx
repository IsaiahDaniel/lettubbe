import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomBottomSheet from '@/components/ui/CustomBottomSheet';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';

export interface MemberActionModalProps {
  isVisible: boolean;
  onClose: () => void;
  member: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    displayName?: string;
  } | null;
  isOwner: boolean;
  isAdmin: boolean;
  isCurrentUserOwner: boolean;
  isCurrentUserAdmin: boolean;
  onMessageMember: () => void;
  onViewProfile: () => void;
  onRemoveMember?: () => void;
  onDemoteAdmin?: () => void;
  onPromoteToAdmin?: () => void;
}

const MemberActionModal: React.FC<MemberActionModalProps> = ({
  isVisible,
  onClose,
  member,
  isOwner,
  isAdmin,
  isCurrentUserOwner,
  isCurrentUserAdmin,
  onMessageMember,
  onViewProfile,
  onRemoveMember,
  onDemoteAdmin,
  onPromoteToAdmin,
}) => {
  const { theme } = useCustomTheme();

  console.log('MemberActionModal render:', { isVisible, member: member?.username });

  if (!member) {
    console.log('No member provided to modal');
    return null;
  }

  const displayName = member.displayName || 
    `${member.firstName || ''} ${member.lastName || ''}`.trim() || 
    member.username || 'Unknown User';

  // Determine what actions are available based on roles
  const canRemoveMember = (isCurrentUserOwner || isCurrentUserAdmin) && !isOwner && onRemoveMember;
  const canDemoteAdmin = isCurrentUserOwner && isAdmin && !isOwner && onDemoteAdmin;
  const canPromoteToAdmin = isCurrentUserOwner && !isAdmin && !isOwner && onPromoteToAdmin;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <CustomBottomSheet
      isVisible={isVisible}
      onClose={onClose}
      sheetheight={400}
    >
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.container}>
          {/* Member Info Header */}
          <View style={styles.memberHeader}>
            <Avatar
              imageSource={{ uri: member.profilePicture || '' }}
              size={64}
              uri
              showRing={false}
            />
            <View style={styles.memberInfo}>
              <Typography weight="600" size={18} textType="textBold">
                {displayName}
              </Typography>
              <Typography size={14} color={Colors[theme].textLight}>
                @{member.username}
              </Typography>
              <View style={styles.badgeContainer}>
                {isOwner && (
                  <View style={[styles.ownerBadge, { backgroundColor: Colors[theme].cardBackground }]}>
                    <Typography size={10} weight="500">
                      Owner
                    </Typography>
                  </View>
                )}
                {!isOwner && isAdmin && (
                  <View style={styles.adminBadge}>
                    <Typography size={10} weight="500" color="white">
                      Admin
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsList}>
            {/* Message Member - Available for all members */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction(onMessageMember)}
            >
              <Ionicons name="chatbubble-outline" size={20} color={Colors[theme].text} />
              <Typography weight="500" size={16} color={Colors[theme].text}>
                Message {member.firstName || member.username}
              </Typography>
            </TouchableOpacity>

            {/* View Profile - Available for all members */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction(onViewProfile)}
            >
              <Ionicons name="person-outline" size={20} color={Colors[theme].text} />
              <Typography weight="500" size={16} color={Colors[theme].text}>
                View Profile
              </Typography>
            </TouchableOpacity>

            {/* Promote to Admin - Only for owners promoting regular members */}
            {canPromoteToAdmin && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction(onPromoteToAdmin!)}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.general.primary} />
                <Typography weight="500" size={16} color={Colors.general.primary}>
                  Make Admin {member.firstName || member.username}
                </Typography>
              </TouchableOpacity>
            )}

            {/* Demote Admin - Only for owners demoting admins */}
            {canDemoteAdmin && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction(onDemoteAdmin!)}
              >
                <Ionicons name="shield-outline" size={20} color={Colors[theme].text} />
                <Typography weight="500" size={16} color={Colors[theme].text}>
                  Demote Admin {member.firstName || member.username}
                </Typography>
              </TouchableOpacity>
            )}

            {/* Remove Member - For owners and admins (but not on other owners) */}
            {canRemoveMember && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction(onRemoveMember!)}
              >
                <Ionicons name="person-remove-outline" size={20} color="#ff4444" />
                <Typography weight="500" size={16} color="#ff4444">
                  Remove {member.firstName || member.username}
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderColor + '20',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.borderColor,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.general.primary,
  },
  actionsList: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 16,
  },
});

export default memo(MemberActionModal);