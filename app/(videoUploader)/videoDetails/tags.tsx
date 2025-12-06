import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Typography from "@/components/ui/Typography/Typography";
import RemixIcon from "react-native-remix-icon";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import useVideoUploadStore from "@/store/videoUploadStore";
import BackButton from "@/components/utilities/BackButton";
import Input from "@/components/ui/inputs/Input";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AppButton from "@/components/ui/AppButton";

export default function TagsScreen() {
  const router = useRouter();
  const { theme } = useCustomTheme();
  const { videoDetails, setVideoDetails, postDetails, setPostDetails, uploadMode } = useVideoUploadStore();

  // Form control for the search input
  const { control, watch } = useForm();

  // State for storing the current search input
  const [searchText, setSearchText] = useState<string>("");
  
  // Watch the search field value
  const watchedSearchText = watch("tagSearch", "");

  // State for tags management
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  // Comprehensive tag categories
  const tagCategories = {
    "Gaming": [
      "Gaming", "Esports", "Twitch", "Streaming", "RPG", "FPS", "MOBA", "Battle Royale",
      "Minecraft", "Fortnite", "League of Legends", "Valorant", "CS:GO", "Apex Legends",
      "Call of Duty", "Overwatch", "Dota 2", "World of Warcraft", "Pokemon", "Nintendo",
      "PlayStation", "Xbox", "PC Gaming", "Mobile Gaming", "Indie Games", "Retro Gaming",
      "Speedrun", "Game Review", "Gaming Tutorial", "Let's Play", "Gaming News"
    ],
    "Music & Audio": [
      "Music", "Song", "Cover", "Remix", "Original", "Live Performance", "Concert", "Album",
      "Rock", "Pop", "Hip Hop", "Jazz", "Classical", "Electronic", "Country", "R&B",
      "Indie", "Alternative", "Reggae", "Blues", "Folk", "Metal", "Punk", "Dance",
      "House", "Techno", "Dubstep", "Trap", "Lo-fi", "Acoustic", "Piano", "Guitar",
      "Vocals", "Instrumental", "Beat", "Producer", "DJ", "Music Video", "Lyric Video"
    ],
    "Ministry & Faith": [
      "Outreaches", "Crusades", "Concerts", "Films", "Rehearsals", "Soul winning", "Movies",
      "Rendition", "Comedy", "Rap", "Dance", "LFAD", "LMM", "LIMA", "ORCHESTRA",
    ],
    "Technology": [
      "Tech", "Technology", "AI", "Artificial Intelligence", "Machine Learning", "Programming",
      "Coding", "JavaScript", "Python", "React", "Node.js", "Web Development", "App Development",
      "Software", "Hardware", "Review", "Unboxing", "iPhone", "Android", "Samsung", "Apple",
      "Google", "Microsoft", "Tesla", "Space", "Innovation", "Startup", "Crypto", "Blockchain",
      "NFT", "VR", "AR", "Metaverse", "5G", "Internet", "Cybersecurity", "Data Science"
    ],
    "Education & Learning": [
      "Education", "Learning", "Tutorial", "How To", "Guide", "Tips", "Course", "Lesson",
      "Study", "School", "College", "University", "Science", "Math", "Physics", "Chemistry",
      "Biology", "History", "Geography", "Language", "English", "Spanish", "French", "Chinese",
      "Japanese", "Literature", "Philosophy", "Psychology", "Economics", "Business", "Finance",
      "Accounting", "Marketing", "Skills", "Career", "Job Interview", "Resume", "Productivity"
    ],
    "Entertainment": [
      "Entertainment", "Movie", "Film", "TV Show", "Series", "Netflix", "Disney", "Marvel",
      "DC", "Anime", "Manga", "Cartoon", "Comedy", "Drama", "Action", "Horror", "Romance",
      "Thriller", "Documentary", "Review", "Trailer", "Behind the Scenes", "Celebrity",
      "News", "Gossip", "Red Carpet", "Awards", "Oscar", "Emmy", "Golden Globe", "Cannes"
    ],
    "Lifestyle & Vlogs": [
      "Lifestyle", "Vlog", "Daily", "Routine", "Morning Routine", "Night Routine", "Day in Life",
      "Personal", "Family", "Relationship", "Dating", "Marriage", "Parenting", "Kids", "Baby",
      "Home", "Organization", "Cleaning", "Minimalism", "Productivity", "Self Care", "Mental Health",
      "Motivation", "Inspiration", "Success", "Goals", "Habits", "Mindfulness", "Meditation"
    ],
    "Beauty & Fashion": [
      "Beauty", "Makeup", "Skincare", "Hair", "Nails", "Fashion", "Style", "Outfit", "OOTD",
      "Haul", "Review", "Tutorial", "Get Ready With Me", "GRWM", "Transformation", "Before After",
      "Product Review", "Sephora", "Ulta", "MAC", "Fenty", "Rare Beauty", "Glossier", "Dior",
      "Chanel", "Gucci", "Prada", "Zara", "H&M", "Shein", "Thrift", "Vintage", "Sustainable Fashion"
    ],
    "Health & Fitness": [
      "Fitness", "Workout", "Exercise", "Gym", "Health", "Nutrition", "Diet", "Weight Loss",
      "Muscle Building", "Cardio", "Strength Training", "Yoga", "Pilates", "Running", "CrossFit",
      "Bodybuilding", "Powerlifting", "Calisthenics", "Home Workout", "HIIT", "Stretching",
      "Flexibility", "Wellness", "Healthy Eating", "Meal Prep", "Protein", "Supplements",
      "Marathon", "Athletic", "Sports", "Training", "Recovery", "Injury Prevention"
    ],
    "Food & Cooking": [
      "Food", "Cooking", "Recipe", "Baking", "Chef", "Kitchen", "Restaurant", "Cuisine", "Italian",
      "Mexican", "Chinese", "Indian", "Japanese", "Thai", "Mediterranean", "American", "French",
      "Healthy", "Vegan", "Vegetarian", "Keto", "Paleo", "Gluten Free", "Dessert", "Cake",
      "Cookies", "Bread", "Pizza", "Pasta", "Sushi", "BBQ", "Grilling", "Street Food",
      "Food Review", "Taste Test", "Mukbang", "ASMR", "Food Challenge", "Meal Prep"
    ],
    "Travel & Adventure": [
      "Travel", "Adventure", "Vacation", "Holiday", "Tourism", "Backpacking", "Solo Travel",
      "Road Trip", "Flight", "Hotel", "Resort", "Beach", "Mountain", "City", "Nature",
      "Europe", "Asia", "America", "Africa", "Australia", "Paris", "London", "Tokyo", "New York",
      "Los Angeles", "Dubai", "Thailand", "Bali", "Greece", "Italy", "Spain", "Budget Travel",
      "Luxury Travel", "Culture", "Food Travel", "Photography", "Hiking", "Camping"
    ],
    "Art & Creativity": [
      "Art", "Drawing", "Painting", "Sketch", "Digital Art", "Traditional Art", "Illustration",
      "Design", "Graphic Design", "UI Design", "Web Design", "Logo", "Branding", "Typography",
      "Photography", "Portrait", "Landscape", "Street Photography", "Wedding Photography",
      "Product Photography", "Editing", "Photoshop", "Lightroom", "Procreate", "Adobe",
      "Creative Process", "Time Lapse", "Speed Art", "Art Tutorial", "Artist", "Gallery"
    ],
    "Business & Finance": [
      "Business", "Entrepreneur", "Startup", "Finance", "Money", "Investment", "Stock Market",
      "Trading", "Crypto", "Bitcoin", "Ethereum", "Real Estate", "Passive Income", "Side Hustle",
      "Marketing", "Social Media Marketing", "Digital Marketing", "SEO", "Content Marketing",
      "Sales", "E-commerce", "Amazon", "Shopify", "Dropshipping", "Affiliate Marketing",
      "Personal Finance", "Budgeting", "Saving", "Debt", "Credit", "Insurance", "Retirement"
    ],
    "Sports": [
      "Sports", "Football", "Soccer", "Basketball", "Baseball", "Tennis", "Golf", "Swimming",
      "Track and Field", "Olympics", "World Cup", "NBA", "NFL", "MLB", "NHL", "Premier League",
      "Champions League", "Highlights", "Analysis", "Prediction", "Fantasy Sports", "Athlete",
      "Training", "Technique", "Skills", "Coaching", "Team", "Competition", "Championship",
      "Extreme Sports", "Skateboarding", "Surfing", "Snowboarding", "Rock Climbing", "Martial Arts"
    ],
    "Science & Nature": [
      "Science", "Nature", "Biology", "Chemistry", "Physics", "Astronomy", "Space", "NASA",
      "Research", "Experiment", "Discovery", "Innovation", "Environment", "Climate Change",
      "Wildlife", "Animals", "Ocean", "Forest", "Conservation", "Sustainability", "Earth",
      "Planet", "Universe", "Galaxy", "Black Hole", "Mars", "Moon", "Solar System",
      "Microscopic", "DNA", "Evolution", "Ecosystem", "Documentary", "Educational"
    ],
    "Comedy & Memes": [
      "Comedy", "Funny", "Humor", "Meme", "Viral", "Trending", "Sketch", "Stand Up", "Parody",
      "Satire", "Prank", "Reaction", "Fail", "Compilation", "TikTok", "Instagram", "Twitter",
      "Social Media", "Internet Culture", "Pop Culture", "Roast", "Joke", "Skit", "Impression",
      "Comedian", "Entertainment", "Laughs", "Hilarious", "Absurd", "Random", "Weird"
    ],
    "News & Politics": [
      "News", "Politics", "Current Events", "Breaking News", "Analysis", "Opinion", "Commentary",
      "Government", "Election", "Democracy", "Policy", "International", "Global", "Local",
      "Economy", "Society", "Culture", "Social Issues", "Human Rights", "Justice", "Law",
      "Court", "Legal", "Investigation", "Journalism", "Reporter", "Interview", "Debate",
      "Discussion", "Fact Check", "Media", "Press Conference", "Update"
    ],
  };

  // Flatten all tags for search functionality
  const allTags = Object.values(tagCategories).flat();

  // Filtered tags based on search input
  const [filteredTags, setFilteredTags] = useState<string[]>(allTags);
  
  // Debug state changes
  // useEffect(() => {
  //   console.log('🔍 filteredTags updated:', filteredTags.length, 'tags');
  // }, [filteredTags]);

  useEffect(() => {
    // Initialize selected tags based on upload mode
    const currentTags = uploadMode === 'video' ? videoDetails.tags : (postDetails.tags || []);
    if (currentTags && currentTags.length > 0) {
      setSelectedTags(currentTags);
    }
  }, [uploadMode]);

  useEffect(() => {
    // Update the appropriate details based on upload mode
    if (uploadMode === 'video') {
      setVideoDetails({ tags: selectedTags });
    } else {
      setPostDetails({ tags: selectedTags });
    }
  }, [selectedTags, uploadMode]);

  // Handle search input change
  const handleSearch = (text: string) => {
    // console.log('🔍 handleSearch called with:', text);
    // console.log('🔍 Total tags available:', allTags.length);
    
    if (text.trim() === "") {
      // console.log('🔍 Search empty, showing all tags');
      setFilteredTags(allTags);
    } else {
      const filtered = allTags.filter((tag) =>
        tag.toLowerCase().includes(text.toLowerCase())
      );
      // console.log('🔍 Filtered tags count:', filtered.length);
      // console.log('🔍 First 5 filtered tags:', filtered.slice(0, 5));
      setFilteredTags(filtered);
    }
  };

  // Add a tag to selected tags
  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setFilteredTags(allTags);
  };

  // Remove a tag from selected tags
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  // Watch for changes in the search input
  useEffect(() => {
    console.log('🔍 Search text changed:', watchedSearchText);
    handleSearch(watchedSearchText);
  }, [watchedSearchText]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
      edges={["top"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <BackButton />
          <Typography size={18} weight="600">
            Tags
          </Typography>
        </View>

        <AppButton
          title="Done"
          variant="compact"
          handlePress={() => router.back()}
          style={{ marginRight: 8 }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.content}>
          {/* Search input using the Input component */}
          <Input
            name="tagSearch"
            control={control}
            placeholder="Search for tags"
            icon="ri-search-line"
          />

          {/* Selected tags display */}
          <View style={styles.selectedTagsContainer}>
            {selectedTags.map((tag, index) => (
              <View
                key={`${tag}-${index}`}
                style={[
                  styles.tagChip,
                  { backgroundColor: Colors.general.primary },
                ]}
              >
                <Typography size={14} color="#FFF" lineHeight={20}>
                  {tag}
                </Typography>
                <TouchableOpacity onPress={() => removeTag(tag)}>
                  <RemixIcon name="close-line" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Filtered tags display */}
          {(() => {
            console.log('🔍 Render check - watchedSearchText:', `"${watchedSearchText}"`);
            console.log('🔍 Render check - filteredTags.length:', filteredTags.length);
            return watchedSearchText.trim() !== "";
          })() && (
            <View style={styles.filteredTagsContainer}>
              {isSearching ? (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color={Colors.general.primary} />
                  <Typography size={14} textType="secondary" style={{ marginLeft: 8 }}>
                    Searching tags...
                  </Typography>
                </View>
              ) : (
                filteredTags.length > 0 ? (
                  filteredTags.map((tag, index) => (
                    <TouchableOpacity
                      key={`filtered-${tag}-${index}`}
                      onPress={() => addTag(tag)}
                      style={[
                        styles.tagChip,
                        {
                          backgroundColor: selectedTags.includes(tag)
                            ? Colors.general.primary
                            : Colors[theme].cardBackground,
                          borderColor: Colors[theme].secondary,
                        },
                      ]}
                    >
                      <Typography
                        size={14}
                        color={
                          selectedTags.includes(tag) ? "#FFF" : Colors[theme].text
                        }
                      >
                        {tag}
                      </Typography>
                      {selectedTags.includes(tag) && (
                        <RemixIcon name="check-line" size={18} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Typography
                    size={14}
                    textType="secondary"
                    style={styles.noResults}
                  >
                    No tags found. Try a different search.
                  </Typography>
                )
              )}
            </View>
          )}

          {/* Popular or suggested tags sections */}
          {watchedSearchText.trim() === "" && (
            <>
              {Object.entries(tagCategories).map(([category, tags]) => (
                <View key={category} style={styles.categorySection}>
                  <TouchableOpacity
                    onPress={() => toggleCategory(category)}
                    style={styles.categoryHeader}
                  >
                    <Typography
                      size={16}
                      weight="600"
                      style={styles.categoryTitle}
                    >
                      {category}
                    </Typography>
                    <RemixIcon
                      name={expandedCategories.has(category) ? "arrow-up-s-line" : "arrow-down-s-line"}
                      size={20}
                      color={Colors[theme].text}
                    />
                  </TouchableOpacity>

                  {expandedCategories.has(category) && (
                    <View style={styles.tagsRow}>
                      {tags.map((tag, index) => (
                        <TouchableOpacity
                          key={`${category}-${tag}-${index}`}
                          onPress={() => addTag(tag)}
                          style={[
                            styles.tagChip,
                            {
                              backgroundColor: selectedTags.includes(tag)
                                ? Colors.general.primary
                                : Colors[theme].cardBackground,
                              borderColor: Colors[theme].secondary,
                            },
                          ]}
                        >
                          <Typography
                            size={14}
                            color={
                              selectedTags.includes(tag)
                                ? "#FFF"
                                : Colors[theme].text
                            }
                          >
                            {tag}
                          </Typography>
                          {selectedTags.includes(tag) ? (
                            <TouchableOpacity onPress={() => removeTag(tag)}>
                              <RemixIcon
                                name="close-line"
                                size={18}
                                color="#FFF"
                              />
                            </TouchableOpacity>
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          <View style={styles.helperSection}>
            <Typography
              size={14}
              weight="500"
              style={[styles.helper, { color: '#ff4444', marginBottom: 8 }]}
            >
              * At least one tag is required
            </Typography>
            <Typography
              size={14}
              weight="400"
              textType="secondary"
              style={styles.helper}
            >
              Tags help viewers discover your {uploadMode === 'video' ? 'video' : 'photos'} when they search for those
              keywords
            </Typography>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  saveButton: {
    padding: 8,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  selectedTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 8,
  },
  filteredTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 8,
  },
  categorySection: {
    marginTop: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 12,
  },
  categoryTitle: {
    flex: 1,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 8,
  },
  helperSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  helper: {
    marginBottom: 4,
  },
  noResults: {
    marginTop: 8,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});
