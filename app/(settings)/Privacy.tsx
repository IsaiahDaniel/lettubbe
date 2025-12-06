import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Wrapper from '@/components/utilities/Wrapper';
import BackButton from '@/components/utilities/BackButton';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Ionicons } from '@expo/vector-icons';

const Privacy = () => {
  const { theme } = useCustomTheme();
  const router = useRouter();

  interface SettingItem {
    title: string;
    description: string;
    onPress: () => void;
    icon: string;
  }

  const privacyItems: SettingItem[] = [
    {
      title: 'Manage account',
      description: 'Account settings and preferences',
      onPress: () => router.push("/(settings)/ManageAccount"),
      icon: 'person-outline',
    },
    // {
    //   title: 'Blocked accounts',
    //   description: 'View and manage blocked accounts',
    //   onPress: () => {},
    //   icon: 'ban-outline',
    // },
    // {
    //   title: 'Privacy settings',
    //   description: 'Control who can see your content',
    //   onPress: () => {},
    //   icon: 'eye-outline',
    // },
  ];

  return (
    <Wrapper>
      <View style={styles.header}>
        <BackButton />
        <Typography weight="700" size={16} color={Colors[theme].textBold}>
          Privacy
        </Typography>
      </View>
      
      <View style={styles.container}>
        {privacyItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            style={[
              styles.settingItem,
            ]}
          >
            <View style={styles.settingContent}>
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={Colors[theme].textBold} 
                style={styles.settingIcon}
              />
              <View style={styles.settingText}>
                <Typography weight="600" size={14} color={Colors[theme].textBold}>
                  {item.title}
                </Typography>
                <Typography weight="400" size={12} color={Colors[theme].text}>
                  {item.description}
                </Typography>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={Colors[theme].text} 
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  container: {
    flex: 1,
  },
  settingItem: {
    marginBottom: 12,
    paddingVertical: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
});

export default Privacy;