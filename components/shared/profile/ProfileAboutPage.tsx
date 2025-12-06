import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { format } from "date-fns";

interface ProfileAboutPageProps {
  userData: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    username?: string;
    description?: string;
    createdAt?: string;
    email?: string;
    totalplays?: number;
    joinDate?: string;
  };
}

const ProfileAboutPage: React.FC<ProfileAboutPageProps> = ({ userData }) => {
  const { theme } = useCustomTheme();
  
  // Format the join date
  const formattedJoinDate = (userData.joinDate || userData.createdAt)
    ? format(new Date(userData.joinDate || userData.createdAt || new Date()), "MMMM yyyy")
    : "Unknown";
    
  // Format view count
  const formatViewCount = (count?: number): string => {
    if (!count) return "0";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return count.toString();
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={[styles.section, { backgroundColor: Colors[theme].cardBackground }]}>
        <Typography weight="600" size={18} style={styles.sectionTitle}>Description</Typography>
        
        {/* Description */}
        <View style={styles.infoSection}>
          <Typography weight="400" style={styles.descriptionText}>
            {userData.description || "No description available"}
          </Typography>
        </View>
      </View>
      
      {/* Stats Section */}
      <View style={[styles.section, { backgroundColor: Colors[theme].cardBackground }]}>
        <Typography weight="600" size={18} style={styles.sectionTitle}>Stats</Typography>
        
        <View style={styles.statsContainer}>
          {/* Join date */}
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={20} color={Colors[theme].text} />
            <View style={styles.statTextContainer}>
              <Typography weight="500">Joined</Typography>
              <Typography weight="400" color={Colors[theme].textLight}>
                {formattedJoinDate}
              </Typography>
            </View>
          </View>
          
          {/* Total plays */}
          <View style={styles.statItem}>
            <Ionicons name="play-outline" size={20} color={Colors[theme].text} />
            <View style={styles.statTextContainer}>
              <Typography weight="500">Total plays</Typography>
              <Typography weight="400" color={Colors[theme].textLight}>
                {formatViewCount(userData.totalplays)} plays
              </Typography>
            </View>
          </View>

        </View>
      </View>
      
      {/* Contact Info Section */}
      {userData.email && (
        <View style={[styles.section, { backgroundColor: Colors[theme].cardBackground }]}>
          <Typography weight="600" size={18} style={styles.sectionTitle}>Contact</Typography>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => Linking.openURL(`mailto:${userData.email}`)}
          >
            <Ionicons name="mail-outline" size={20} color={Colors.general.blue} />
            <Typography 
              weight="400" 
              color={Colors.general.blue}
              style={styles.linkText}
            >
              {userData.email}
            </Typography>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  section: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  infoSection: {
    marginBottom: 10,
  },
  descriptionText: {
    lineHeight: 20,
  },
  statsContainer: {
    gap: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  linksContainer: {
    gap: 12,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkText: {
    flex: 1,
  }
});

export default ProfileAboutPage;