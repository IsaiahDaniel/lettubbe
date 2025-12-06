import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import CustomBottomSheet from "@/components/shared/videoUpload/CustomBottomSheet";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Linking, TouchableOpacity } from "react-native";

type TermsAndPrivacyModalProps = {
  isVisible: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
};

const TermsAndPrivacyModal: React.FC<TermsAndPrivacyModalProps> = ({
  isVisible,
  onClose,
  type,
}) => {
  const { theme } = useCustomTheme();

  const privacyPolicyContent = (
    <ScrollView
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      <Typography
        textType="textBold"
        weight="700"
        size={20}
        style={styles.mainTitle}
      >
        Terms of Agreement and Privacy Policy for Lettubbe+
      </Typography>

      {type === "privacy" && (
        <>
          <Typography style={styles.lastUpdated}>
            <Typography weight="600">Last Updated: 6/25/2025</Typography>
          </Typography>

          <SectionHeader>1. Introduction</SectionHeader>
          <Typography style={styles.paragraph}>
            Lettubbe+ ("we," "us," or "our") operates a video streaming and
            instant messaging platform. This Privacy Policy outlines how we
            collect, use, share, and protect your data to deliver our services
            while safeguarding your rights. By using Lettubbe+, you agree to the
            terms herein.
          </Typography>

          <SectionHeader>2. Information We Collect</SectionHeader>
          <BulletList
            items={[
              "Account Data: Name, email, phone number, username, and payment details (if applicable).",
              "Content: Videos uploaded, comments, messages, live streams, and metadata (e.g., timestamps).",
              "Usage Data: Watch history, search queries, device type, IP address, and cookies (see Section 7).",
              "Messaging Data: Message content, recipient info, and shared media (stored securely).",
              "Third-Party Data: Social media profiles (if linked) or analytics from partners.",
            ]}
          />

          <SectionHeader>3. How We Use Your Information</SectionHeader>
          <Typography style={styles.subheading}>We process data to:</Typography>
          <BulletList
            items={[
              "Provide, personalize, and improve Lettubbe's services.",
              "Moderate content, enforce policies, and ensure security.",
              "Communicate updates, offers, or legal notices.",
              "Comply with laws, respond to legal requests, or protect rights.",
              "Analyze trends via anonymized/aggregated data.",
            ]}
          />

          <SectionHeader>4. Data Sharing</SectionHeader>
          <Typography style={styles.subheading}>
            We only share data under these circumstances:
          </Typography>
          <BulletList
            items={[
              "Service Providers: Trusted vendors (e.g., hosting, payment processors) bound by confidentiality.",
              "Legal Compliance: To authorities if required by law or to protect safety.",
              "Business Transfers: In mergers, sales, or acquisitions (users will be notified).",
              "With Your Consent: For third-party integrations or features you enable.",
            ]}
          />
          <Typography style={styles.paragraph}>
            You retain ownership of the content you upload (e.g., videos, images). By uploading content, you grant Lettubbe+ and Loveworld Inc. a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, distribute, and display that content within the platform and for promotional or functional purposes. Your content will not be sold or used in third-party advertising without your explicit consent. By signing up you consent to receiving emails from us, you may choose to unsubscribe whenever you want to.
          </Typography>

          <SectionHeader>5. Data Retention</SectionHeader>
          <Typography style={styles.paragraph}>
            We retain data only as long as necessary to:
          </Typography>
          <BulletList
            items={[
              "Fulfill service obligations.",
              "Comply with legal/tax requirements.",
              "Maintain security or resolve disputes.",
            ]}
          />
          <Typography style={styles.paragraph}>
            Users may request deletion (Section 6).
          </Typography>

          <SectionHeader>6. Your Rights & Choices</SectionHeader>
          <Typography style={styles.paragraph}>You may:</Typography>
          <BulletList
            items={[
              "Access, correct, or delete personal data via account settings.",
              "Export data using our self-service tools.",
              "Opt out of marketing emails (unsubscribe link in messages).",
              "Disable cookies (may affect functionality).",
              "Withdraw consent (contact support@lettubbe.com).",
            ]}
          />
          <Typography style={styles.note}>
            Note: We may retain certain data for legal or operational needs.
          </Typography>

          <SectionHeader>7. Cookies & Tracking Technologies</SectionHeader>
          <Typography style={styles.paragraph}>We use cookies to:</Typography>
          <BulletList
            items={[
              "Authenticate users.",
              "Analyze traffic (e.g., Google Analytics).",
              "Deliver targeted ads (opt out via browser settings).",
            ]}
          />

          <SectionHeader>8. Security</SectionHeader>
          <Typography style={styles.paragraph}>
            We implement measures like encryption, access controls, and audits.
            However, no system is 100% secure. You are responsible for
            safeguarding your password and reporting breaches.
          </Typography>

          <SectionHeader>9. International Data Transfers</SectionHeader>
          <Typography style={styles.paragraph}>
            Data may be processed globally. We comply with GDPR, CCPA, and other
            laws, ensuring transfers use adequate safeguards (e.g., EU Standard
            Contractual Clauses).
          </Typography>

          <SectionHeader>10. Children's Privacy</SectionHeader>
          <Typography style={styles.paragraph}>
            Lettubbe+ is not intended for users under 13. We do not knowingly
            collect data from children without parental consent. Report underage
            accounts at{" "}
            <TouchableOpacity onPress={() => Linking.openURL("mailto:support@lettubbe.com")}>
              <Typography
                style={{
                  color: Colors.general.blue,
                  textDecorationLine: "underline",
                }}
              >
                support@lettubbe.com
              </Typography>
            </TouchableOpacity>
            .
          </Typography>

          <SectionHeader>11. Updates to This Policy</SectionHeader>
          <Typography style={styles.paragraph}>
            We may update this policy periodically. Material changes will be
            notified via email or in-app alerts. Continued use constitutes
            acceptance.
          </Typography>

          <SectionHeader>12. Contact Us</SectionHeader>
          <Typography style={styles.paragraph}>
            For questions, requests, or complaints:
          </Typography>
          <Typography style={[styles.paragraph, { paddingLeft: 16 }]}>
            • Email:{" "}
            <TouchableOpacity onPress={() => Linking.openURL("mailto:support@lettubbe.com")}>
              <Typography
                style={{
                  color: Colors.general.blue,
                  textDecorationLine: "underline",
                }}
              >
                support@lettubbe.com
              </Typography>
            </TouchableOpacity>
          </Typography>

          <SectionHeader>13. Governing Law</SectionHeader>
          <Typography style={styles.paragraph}>
            Disputes are subject to the laws of Nigeria, with exclusive
            jurisdiction in specified courts.
          </Typography>

          <Typography style={[styles.paragraph, styles.lastStatement]}>
            Your use of Lettubbe+ signifies acceptance of this policy.
          </Typography>
        </>
      )}

      {type === "terms" && (
        <>
          <Typography style={styles.lastUpdated}>
            <Typography weight="600">Last Updated: 6/25/2025</Typography>
          </Typography>

          <SectionHeader>1. Introduction</SectionHeader>
          <Typography style={styles.paragraph}>
            Lettubbe+ ("we," "us," or "our") operates a video streaming and
            instant messaging platform. This Privacy Policy outlines how we
            collect, use, share, and protect your data to deliver our services
            while safeguarding your rights. By using Lettubbe+, you agree to the
            terms herein.
          </Typography>

          <SectionHeader>2. Information We Collect</SectionHeader>
          <BulletList
            items={[
              "Account Data: Name, email, phone number, username, and payment details (if applicable).",
              "Content: Videos uploaded, comments, messages, live streams, and metadata (e.g., timestamps).",
              "Usage Data: Watch history, search queries, device type, IP address, and cookies (see Section 7).",
              "Messaging Data: Message content, recipient info, and shared media (stored securely).",
              "Third-Party Data: Social media profiles (if linked) or analytics from partners.",
            ]}
          />

          <SectionHeader>3. How We Use Your Information</SectionHeader>
          <Typography style={styles.subheading}>We process data to:</Typography>
          <BulletList
            items={[
              "Provide, personalize, and improve Lettubbe's services.",
              "Moderate content, enforce policies, and ensure security.",
              "Communicate updates, offers, or legal notices.",
              "Comply with laws, respond to legal requests, or protect rights.",
              "Analyze trends via anonymized/aggregated data.",
            ]}
          />

          <SectionHeader>4. Data Sharing</SectionHeader>
          <Typography style={styles.subheading}>
            We only share data under these circumstances:
          </Typography>
          <BulletList
            items={[
              "Service Providers: Trusted vendors (e.g., hosting, payment processors) bound by confidentiality.",
              "Legal Compliance: To authorities if required by law or to protect safety.",
              "Business Transfers: In mergers, sales, or acquisitions (users will be notified).",
              "With Your Consent: For third-party integrations or features you enable.",
            ]}
          />
          <Typography style={styles.paragraph}>
            You retain ownership of the content you upload (e.g., videos, images). By uploading content, you grant Lettubbe+ and Loveworld Inc. a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, distribute, and display that content within the platform and for promotional or functional purposes. Your content will not be sold or used in third-party advertising without your explicit consent. By signing up you consent to receiving emails from us, you may choose to unsubscribe whenever you want to.
          </Typography>

          <SectionHeader>5. Data Retention</SectionHeader>
          <Typography style={styles.paragraph}>
            We retain data only as long as necessary to:
          </Typography>
          <BulletList
            items={[
              "Fulfill service obligations.",
              "Comply with legal/tax requirements.",
              "Maintain security or resolve disputes.",
            ]}
          />
          <Typography style={styles.paragraph}>
            Users may request deletion (Section 6).
          </Typography>

          <SectionHeader>6. Your Rights & Choices</SectionHeader>
          <Typography style={styles.paragraph}>You may:</Typography>
          <BulletList
            items={[
              "Access, correct, or delete personal data via account settings.",
              "Export data using our self-service tools.",
              "Opt out of marketing emails (unsubscribe link in messages).",
              "Disable cookies (may affect functionality).",
              "Withdraw consent (contact support@lettubbe.com).",
            ]}
          />
          <Typography style={styles.note}>
            Note: We may retain certain data for legal or operational needs.
          </Typography>

          <SectionHeader>7. Cookies & Tracking Technologies</SectionHeader>
          <Typography style={styles.paragraph}>We use cookies to:</Typography>
          <BulletList
            items={[
              "Authenticate users.",
              "Analyze traffic (e.g., Google Analytics).",
              "Deliver targeted ads (opt out via browser settings).",
            ]}
          />

          <SectionHeader>8. Security</SectionHeader>
          <Typography style={styles.paragraph}>
            We implement measures like encryption, access controls, and audits.
            However, no system is 100% secure. You are responsible for
            safeguarding your password and reporting breaches.
          </Typography>

          <SectionHeader>9. International Data Transfers</SectionHeader>
          <Typography style={styles.paragraph}>
            Data may be processed globally. We comply with GDPR, CCPA, and other
            laws, ensuring transfers use adequate safeguards (e.g., EU Standard
            Contractual Clauses).
          </Typography>

          <SectionHeader>10. Children's Privacy</SectionHeader>
          <Typography style={styles.paragraph}>
            Lettubbe+ is not intended for users under 13. We do not knowingly
            collect data from children without parental consent. Report underage
            accounts at{" "}
            <TouchableOpacity onPress={() => Linking.openURL("mailto:support@lettubbe.com")}>
              <Typography
                style={{
                  color: Colors.general.blue,
                  textDecorationLine: "underline",
                }}
              >
                support@lettubbe.com
              </Typography>
            </TouchableOpacity>
            .
          </Typography>

          <SectionHeader>11. Updates to This Policy</SectionHeader>
          <Typography style={styles.paragraph}>
            We may update this policy periodically. Material changes will be
            notified via email or in-app alerts. Continued use constitutes
            acceptance.
          </Typography>

          <SectionHeader>12. Contact Us</SectionHeader>
          <Typography style={styles.paragraph}>
            For questions, requests, or complaints:
          </Typography>
          <Typography style={[styles.paragraph, { paddingLeft: 16 }]}>
            • Email:{" "}
            <TouchableOpacity onPress={() => Linking.openURL("mailto:support@lettubbe.com")}>
              <Typography
                style={{
                  color: Colors.general.blue,
                  textDecorationLine: "underline",
                }}
              >
                support@lettubbe.com
              </Typography>
            </TouchableOpacity>
          </Typography>

          <SectionHeader>13. Governing Law</SectionHeader>
          <Typography style={styles.paragraph}>
            Disputes are subject to the laws of Nigeria, with exclusive
            jurisdiction in specified courts.
          </Typography>

          <Typography style={[styles.paragraph, styles.lastStatement]}>
            Your use of Lettubbe+ signifies acceptance of this policy.
          </Typography>
        </>
      )}
    </ScrollView>
  );

  return (
    <CustomBottomSheet
      isVisible={isVisible}
      onClose={onClose}
      sheetheight="90%"
    >
      {privacyPolicyContent}
    </CustomBottomSheet>
  );
};

// Helper component for section headers
const SectionHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { theme } = useCustomTheme();
  return (
    <Typography
      textType="textBold"
      weight="600"
      size={16}
      style={{
        marginTop: 16,
        marginBottom: 8,
        color: Colors[theme].text,
      }}
    >
      {children}
    </Typography>
  );
};

// Helper component for bullet lists
const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <View style={{ paddingLeft: 16 }}>
    {items.map((item, index) => (
      <View
        key={index}
        style={{
          flexDirection: "row",
          marginBottom: 8,
          alignItems: "flex-start",
        }}
      >
        <Typography style={{ marginRight: 8 }}>•</Typography>
        <Typography style={{ flex: 1 }}>{item}</Typography>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  mainTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  lastUpdated: {
    marginBottom: 12,
    textAlign: "center",
  },
  paragraph: {
    marginBottom: 12,
  },
  subheading: {
    marginBottom: 12,
  },
  note: {
    marginBottom: 12,
    fontStyle: "italic",
    paddingLeft: 16,
  },
  lastStatement: {
    marginTop: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default TermsAndPrivacyModal;
