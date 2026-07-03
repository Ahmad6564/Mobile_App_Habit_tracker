import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../src/components/ScreenBackground";
import Card from "../../src/components/Card";
import GradientButton from "../../src/components/GradientButton";
import Icon from "../../src/components/Icon";
import { useTheme } from "../../src/ThemeContext";
import { space } from "../../src/theme";
import { Post, useAppStore } from "../../src/store/useAppStore";

type CommunityTab = "feed" | "messages" | "search" | "profile";
type HubTab = "posts" | "reels" | "reposts";
type PeopleModal = "followers" | "following" | null;

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");
  const historyRef = useRef<CommunityTab[]>(["feed"]);

  const navigate = useCallback((tab: CommunityTab) => {
    if (tab !== activeTab) {
      historyRef.current.push(tab);
      setActiveTab(tab);
    }
  }, [activeTab]);

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (historyRef.current.length > 1) {
        historyRef.current.pop();
        setActiveTab(historyRef.current[historyRef.current.length - 1]);
        return true; // prevent default back
      }
      return false; // let system handle (exit community)
    });
    return () => handler.remove();
  }, []);

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {activeTab === "feed" && <FeedView />}
        {activeTab === "messages" && <MessagesView />}
        {activeTab === "search" && <SearchView />}
        {activeTab === "profile" && <ProfileView />}
        <CommunityNavBar active={activeTab} onSelect={navigate} />
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* =============== BOTTOM NAV BAR =============== */
function CommunityNavBar({ active, onSelect }: { active: CommunityTab; onSelect: (t: CommunityTab) => void }) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.navBar, { backgroundColor: isDark ? "rgba(11,16,32,0.95)" : "rgba(255,255,255,0.97)", borderTopColor: colors.line }]}>
      <Pressable onPress={() => router.replace("/(tabs)")} style={styles.navItem}>
        <Icon name="dashboard" size={22} color={colors.muted} />
        <Text style={[styles.navLabel, { color: colors.muted }]}>Home</Text>
      </Pressable>
      <NavBtn icon="paperPlane" label="Messages" active={active === "messages"} onPress={() => onSelect("messages")} />
      <NavBtn icon="search" label="Search" active={active === "search"} onPress={() => onSelect("search")} />
      <NavBtn icon="user" label="Profile" active={active === "profile"} onPress={() => onSelect("profile")} />
    </View>
  );
}

function NavBtn({ icon, label, active, onPress }: { icon: string; label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <Icon name={icon} size={22} color={active ? colors.cyan : colors.muted} />
      <Text style={[styles.navLabel, { color: active ? colors.cyan : colors.muted, fontWeight: active ? "800" : "600" }]}>{label}</Text>
    </Pressable>
  );
}

/* =============== FEED VIEW =============== */
function FeedView() {
  const router = useRouter();
  const { colors } = useTheme();
  const { state, unreadNotifCount } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const unread = unreadNotifCount();

  const feed = useMemo(() => {
    return state.posts.filter((p) => !state.blocked.includes(p.user));
  }, [state.posts, state.blocked]);

  return (
    <View style={{ flex: 1 }}>
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.line }]}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.ink }}>Community</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => setShowCreateModal(true)} style={[styles.iconBtn, { backgroundColor: "rgba(34,211,238,0.16)", borderColor: colors.cyan }]}>
            <Icon name="plus" size={20} color={colors.cyan} />
          </Pressable>
          <Pressable onPress={() => router.push("/community/notifications" as any)} style={[styles.iconBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
            <Icon name="bell" size={18} color={colors.ink} />
            {unread > 0 && (
              <View style={[styles.dot, { backgroundColor: colors.pink }]}>
                <Text style={styles.dotText}>{unread > 9 ? "9+" : unread}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Feed list */}
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 80, gap: space.md, paddingTop: space.sm }}
        renderItem={({ item }) => <FeedPostCard post={item} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Icon name="community" size={40} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: space.sm }}>No posts yet. Tap + to create one!</Text>
          </View>
        }
      />

      {/* Create Post Modal */}
      <CreatePostModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </View>
  );
}

/* =============== CREATE POST MODAL =============== */
function CreatePostModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { addPost, state } = useAppStore();
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [format, setFormat] = useState<"text" | "gallery" | "video">("text");

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8
    });
    if (!res.canceled) {
      setMedia(res.assets.map((a) => a.uri));
      setFormat("gallery");
    }
  };

  const pickVideo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.7
    });
    if (!res.canceled && res.assets[0]) {
      setMedia([res.assets[0].uri]);
      setFormat("video");
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      setMedia([res.assets[0].uri]);
      setFormat("gallery");
    }
  };

  const publish = () => {
    if (!caption.trim() && !media.length) return;
    addPost({
      caption: caption.trim(),
      media,
      format,
      tags: caption.match(/#\w+/g)?.map((t) => t.slice(1)) || []
    });
    setCaption("");
    setMedia([]);
    setFormat("text");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.createSheet, { backgroundColor: colors.surface1, borderColor: colors.line }]} onStartShouldSetResponder={() => true}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>Create Post</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="close" size={20} color={colors.muted} />
            </Pressable>
          </View>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.createInput, { borderColor: colors.line, backgroundColor: colors.surface2, color: colors.ink }]}
          />

          {media.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {media.map((uri, i) => (
                <View key={i} style={{ marginRight: 8, position: "relative" }}>
                  <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                  <Pressable
                    onPress={() => setMedia((m) => m.filter((_, idx) => idx !== i))}
                    style={[styles.removeMediaBtn, { backgroundColor: colors.pink }]}
                  >
                    <Icon name="close" size={10} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
            <Pressable onPress={pickImage} style={[styles.mediaBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Icon name="gallery" size={18} color={colors.cyan} />
              <Text style={{ fontSize: 12, color: colors.ink }}>Photo</Text>
            </Pressable>
            <Pressable onPress={pickVideo} style={[styles.mediaBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Icon name="video" size={18} color={colors.pink} />
              <Text style={{ fontSize: 12, color: colors.ink }}>Video</Text>
            </Pressable>
            <Pressable onPress={takePhoto} style={[styles.mediaBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Icon name="gallery" size={18} color={colors.amber} />
              <Text style={{ fontSize: 12, color: colors.ink }}>Camera</Text>
            </Pressable>
          </View>

          <GradientButton title="Publish" onPress={publish} />
        </View>
      </Pressable>
    </Modal>
  );
}

/* =============== MESSAGES VIEW =============== */
function MessagesView() {
  const { colors } = useTheme();
  const router = useRouter();
  const { state } = useAppStore();

  const conversations = useMemo(() => {
    const entries = Object.entries(state.dms).map(([username, msgs]) => {
      const last = msgs[msgs.length - 1];
      return { username, last, count: msgs.length };
    });
    return entries.sort((a, b) => (b.last?.ts || 0) - (a.last?.ts || 0));
  }, [state.dms]);

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.topBar, { borderBottomColor: colors.line }]}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.ink }}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.username}
        contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", padding: space.xxl }}>
            <Icon name="paperPlane" size={40} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: space.sm, fontSize: 15 }}>No conversations yet</Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>Open a profile and tap Message to start chatting.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const user = state.users.find((u) => u.username === item.username);
          return (
            <Pressable
              onPress={() => router.push(`/community/chat/${item.username}` as any)}
              style={[styles.msgItem, { backgroundColor: colors.surface1, borderColor: colors.line }]}
            >
              <View style={[styles.msgAvatar, { backgroundColor: colors.surface2 }]}>
                <Text style={{ fontSize: 20 }}>{user?.avatar || item.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>{user?.name || item.username}</Text>
                <Text numberOfLines={1} style={{ fontSize: 13, color: colors.muted }}>
                  {item.last?.text || (item.last?.mediaType === "video" ? "Sent a video" : item.last?.mediaType === "image" ? "Sent a photo" : "Say hi")}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.muted }}>{timeAgo(item.last?.ts || 0)}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

/* =============== SEARCH VIEW =============== */
function SearchView() {
  const { colors } = useTheme();
  const router = useRouter();
  const { state } = useAppStore();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return { users: [], posts: [] };
    const q = query.toLowerCase();
    const users = state.users.filter(
      (u) => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
    const posts = state.posts.filter(
      (p) =>
        p.caption.toLowerCase().includes(q) ||
        p.user.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
    return { users, posts };
  }, [query, state.users, state.posts]);

  const hasResults = results.users.length > 0 || results.posts.length > 0;
  const showExplore = !query.trim();

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.topBar, { borderBottomColor: colors.line }]}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.ink }}>Search</Text>
      </View>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
          <Icon name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people, posts, tags…"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, color: colors.ink, paddingVertical: 10, fontSize: 15 }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Icon name="close" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 80 }}>
        {showExplore && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>EXPLORE</Text>
            <View style={styles.exploreGrid}>
              {state.posts.filter((p) => p.media?.length || p.image).slice(0, 9).map((p) => (
                <Pressable key={p.id} onPress={() => router.push(`/community/comments/${p.id}` as any)} style={styles.exploreTile}>
                  <Image source={{ uri: p.media?.[0] || p.image }} style={{ width: "100%", height: "100%", borderRadius: 4 }} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {!showExplore && !hasResults && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ color: colors.muted }}>No results for "{query}"</Text>
          </View>
        )}

        {results.users.length > 0 && (
          <View style={{ gap: 10, marginBottom: 20 }}>
            <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>PEOPLE</Text>
            {results.users.slice(0, 10).map((u) => (
              <Pressable
                key={u.username}
                onPress={() => router.push(`/community/${u.username}` as any)}
                style={[styles.searchUserRow, { backgroundColor: colors.surface1, borderColor: colors.line }]}
              >
                <View style={[styles.searchUserAvatar, { backgroundColor: colors.surface2 }]}>
                  <Text style={{ fontSize: 20 }}>{u.avatar || u.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "700" }}>{u.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>@{u.username}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {results.posts.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>POSTS</Text>
            {results.posts.slice(0, 10).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/community/comments/${p.id}` as any)}
                style={[styles.searchPostRow, { backgroundColor: colors.surface1, borderColor: colors.line }]}
              >
                {(p.media?.[0] || p.image) && (
                  <Image source={{ uri: p.media?.[0] || p.image }} style={{ width: 50, height: 50, borderRadius: 8 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink, fontSize: 13, fontWeight: "700" }}>{p.user}</Text>
                  <Text numberOfLines={2} style={{ color: colors.muted, fontSize: 12 }}>{p.caption}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* =============== PROFILE VIEW =============== */
function ProfileView() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    state,
    updateProfile,
    followUser,
    unfollowUser,
    cancelFollowRequest,
    isFollowing,
    hasRequested
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<HubTab>("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [peopleModal, setPeopleModal] = useState<PeopleModal>(null);

  const me = state.profile.username || state.profile.name || "you";
  const myPosts = useMemo(() => state.posts.filter((p) => p.user === me), [state.posts, me]);
  const myReels = useMemo(() => myPosts.filter((p) => (p.format || "text") === "video"), [myPosts]);
  const myGridPosts = useMemo(() => myPosts.filter((p) => (p.format || "text") !== "video"), [myPosts]);
  const myReposts = useMemo(() => state.posts.filter((p) => p.reposted), [state.posts]);

  const [draft, setDraft] = useState({
    name: state.profile.name,
    username: state.profile.username,
    bio: state.profile.bio,
    avatarUri: state.profile.avatarUri || ""
  });

  const openEdit = () => {
    setDraft({
      name: state.profile.name,
      username: state.profile.username,
      bio: state.profile.bio,
      avatarUri: state.profile.avatarUri || ""
    });
    setShowEdit(true);
  };

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });
    if (!res.canceled) {
      setDraft((d) => ({ ...d, avatarUri: res.assets[0].uri }));
    }
  };

  const saveProfile = () => {
    updateProfile({
      name: draft.name.trim() || state.profile.name,
      username: draft.username.trim() || state.profile.username,
      bio: draft.bio,
      avatarUri: draft.avatarUri
    });
    setShowEdit(false);
  };

  const people = useMemo(() => {
    if (!peopleModal) return [];
    const ids = peopleModal === "followers" ? state.followers : state.following;
    return ids.map((username) => {
      const user = state.users.find((u) => u.username === username);
      return {
        username,
        name: user?.name || username,
        avatar: user?.avatar || username.charAt(0).toUpperCase(),
        bio: user?.bio || ""
      };
    });
  }, [peopleModal, state.followers, state.following, state.users]);

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.topBar, { borderBottomColor: colors.line }]}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.ink }}>Profile</Text>
      </View>

      <ScrollView stickyHeaderIndices={[1]} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={[styles.profileWrap, { borderBottomColor: colors.line }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Pressable onPress={openEdit} style={[styles.avatarWrap, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              {state.profile.avatarUri ? (
                <Image source={{ uri: state.profile.avatarUri }} style={styles.avatarImg} />
              ) : (
                <Text style={{ fontSize: 30 }}>{(state.profile.name || "U").charAt(0).toUpperCase()}</Text>
              )}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{state.profile.name || "You"}</Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>@{state.profile.username || "you"}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }} numberOfLines={2}>
                {state.profile.bio || "Add a bio to tell your story."}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={{ fontSize: 17, fontWeight: "900", color: colors.ink }}>{myPosts.length}</Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>Posts</Text>
            </View>
            <Pressable onPress={() => setPeopleModal("followers")} style={styles.statItem}>
              <Text style={{ fontSize: 17, fontWeight: "900", color: colors.ink }}>{state.followers.length}</Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>Followers</Text>
            </Pressable>
            <Pressable onPress={() => setPeopleModal("following")} style={styles.statItem}>
              <Text style={{ fontSize: 17, fontWeight: "900", color: colors.ink }}>{state.following.length}</Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>Following</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: space.md }}>
            <GradientButton title="Edit Profile" variant="ghost" onPress={openEdit} />
          </View>
        </View>

        <View style={[styles.tabsSticky, { backgroundColor: colors.bg0, borderBottomColor: colors.line }]}>
          <View style={styles.tabsRow}>
            <ProfileTabBtn label="Posts" active={activeTab === "posts"} onPress={() => setActiveTab("posts")} />
            <ProfileTabBtn label="Reels" active={activeTab === "reels"} onPress={() => setActiveTab("reels")} />
            <ProfileTabBtn label="Reposts" active={activeTab === "reposts"} onPress={() => setActiveTab("reposts")} />
          </View>
        </View>

        <View style={{ padding: space.lg }}>
          {activeTab === "posts" ? (
            <PostsGrid posts={myGridPosts} />
          ) : activeTab === "reels" ? (
            <ReelsList posts={myReels} />
          ) : (
            <RepostsList posts={myReposts} />
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEdit} transparent animationType="fade" onRequestClose={() => setShowEdit(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEdit(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface1, borderColor: colors.line }]} onStartShouldSetResponder={() => true}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.ink, marginBottom: 10 }}>Edit Profile</Text>
            <Pressable onPress={pickAvatar} style={[styles.avatarEdit, { borderColor: colors.line, backgroundColor: colors.surface2 }]}>
              {draft.avatarUri ? (
                <Image source={{ uri: draft.avatarUri }} style={styles.avatarEditImg} />
              ) : (
                <Text style={{ fontSize: 28 }}>{(draft.name || "U").charAt(0).toUpperCase()}</Text>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: colors.cyan }]}>
                <Icon name="plus" size={10} color="#001018" />
              </View>
            </Pressable>
            <TextInput
              value={draft.name}
              onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
              placeholder="Name"
              placeholderTextColor={colors.muted}
              style={[styles.input, { borderColor: colors.line, backgroundColor: colors.surface2, color: colors.ink }]}
            />
            <TextInput
              value={draft.username}
              onChangeText={(v) => setDraft((d) => ({ ...d, username: v }))}
              placeholder="Username"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              style={[styles.input, { borderColor: colors.line, backgroundColor: colors.surface2, color: colors.ink }]}
            />
            <TextInput
              value={draft.bio}
              onChangeText={(v) => setDraft((d) => ({ ...d, bio: v }))}
              placeholder="Bio"
              placeholderTextColor={colors.muted}
              multiline
              style={[styles.input, styles.bioInput, { borderColor: colors.line, backgroundColor: colors.surface2, color: colors.ink }]}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <GradientButton title="Save" onPress={saveProfile} />
              </View>
              <View style={{ flex: 1 }}>
                <GradientButton title="Cancel" variant="ghost" onPress={() => setShowEdit(false)} />
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Followers / Following Modal */}
      <Modal visible={!!peopleModal} transparent animationType="slide" onRequestClose={() => setPeopleModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.peopleSheet, { backgroundColor: colors.surface1, borderColor: colors.line }]}>
            <View style={styles.peopleHead}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.ink, textTransform: "capitalize" }}>
                {peopleModal}
              </Text>
              <Pressable onPress={() => setPeopleModal(null)} hitSlop={6}>
                <Icon name="close" size={18} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              {people.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", paddingVertical: 20 }}>No users found.</Text>
              ) : (
                people.map((u) => {
                  const following = isFollowing(u.username);
                  const requested = hasRequested(u.username);
                  const canAction = u.username !== me;
                  return (
                    <View key={`${peopleModal}-${u.username}`} style={[styles.userRow, { borderColor: colors.line, backgroundColor: colors.surface2 }]}>
                      <Pressable onPress={() => router.push(`/community/${u.username}` as any)} style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                        <View style={[styles.userAvatar, { backgroundColor: colors.surface1 }]}>
                          <Text style={{ fontSize: 18 }}>{u.avatar}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "700" }}>{u.name}</Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>@{u.username}</Text>
                        </View>
                      </Pressable>
                      {canAction ? (
                        <Pressable
                          onPress={() => {
                            if (following) unfollowUser(u.username);
                            else if (requested) cancelFollowRequest(u.username);
                            else followUser(u.username);
                          }}
                          style={[styles.followBtn, { borderColor: colors.line, backgroundColor: following ? colors.surface1 : "rgba(34,211,238,0.16)" }]}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "800", color: following ? colors.muted : colors.cyan }}>
                            {following ? "Following" : requested ? "Requested" : "Follow"}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =============== FEED POST CARD =============== */
function FeedPostCard({ post }: { post: Post }) {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    state,
    togglePostLike,
    togglePostSave,
    togglePostRepost,
    followUser,
    unfollowUser,
    cancelFollowRequest,
    isFollowing,
    hasRequested
  } = useAppStore();

  const me = state.profile.username || state.profile.name || "you";
  const isMine = post.user === me;
  const following = isFollowing(post.user);
  const requested = hasRequested(post.user);
  const media = post.media?.length ? post.media : post.image ? [post.image] : [];
  const format = post.format || (media.length ? "gallery" : "text");

  const onToggleFollow = () => {
    if (following) unfollowUser(post.user);
    else if (requested) cancelFollowRequest(post.user);
    else followUser(post.user);
  };

  const onShare = async () => {
    try { await Share.share({ message: `${post.user}: ${post.caption}` }); } catch {}
  };

  return (
    <Card padded={false}>
      <Pressable onPress={() => router.push(`/community/${post.user}` as any)} style={styles.head}>
        <View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
          <Text style={{ fontSize: 18 }}>{post.avatar}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>{post.user}</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>{post.createdAt}</Text>
        </View>
        {!isMine && (
          <Pressable onPress={onToggleFollow} style={[styles.followBtn, { borderColor: colors.line, backgroundColor: following ? colors.surface2 : "rgba(34,211,238,0.16)" }]}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: following ? colors.muted : colors.cyan }}>
              {following ? "Following" : requested ? "Requested" : "Follow"}
            </Text>
          </Pressable>
        )}
      </Pressable>

      {format === "text" ? (
        <View style={[styles.textPost, { borderTopColor: colors.line, borderBottomColor: colors.line }]}>
          <Text style={{ fontSize: 17, lineHeight: 26, color: colors.ink, fontWeight: "600" }}>{post.caption}</Text>
        </View>
      ) : format === "video" ? (
        <Pressable onPress={() => router.push({ pathname: "/community/reels" as any, params: { postId: post.id } })}>
          <Image source={{ uri: media[0] }} style={styles.media} />
          <View style={styles.playOverlay}>
            <Icon name="play" size={42} color="#fff" />
          </View>
        </Pressable>
      ) : (
        <Image source={{ uri: media[0] }} style={styles.media} />
      )}

      <View style={{ padding: space.md, gap: 6 }}>
        <View style={styles.actions}>
          <View style={{ flexDirection: "row", gap: 18 }}>
            <Pressable onPress={() => togglePostLike(post.id)}>
              <Icon name={post.liked ? "heartFilled" : "heart"} size={23} color={post.liked ? "#ef4444" : colors.ink} />
            </Pressable>
            <Pressable onPress={() => router.push(`/community/comments/${post.id}` as any)}>
              <Icon name="comment" size={22} color={colors.ink} />
            </Pressable>
            <Pressable onPress={() => togglePostRepost(post.id)}>
              <Icon name="repeat" size={23} color={post.reposted ? "#10b981" : colors.ink} />
            </Pressable>
            <Pressable onPress={onShare}>
              <Icon name="share" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <Pressable onPress={() => togglePostSave(post.id)}>
            <Text style={{ fontSize: 20, color: post.saved ? colors.amber : colors.ink }}>{post.saved ? "🔖" : "📑"}</Text>
          </Pressable>
        </View>
        <Text style={{ color: colors.ink, fontSize: 13, fontWeight: "700" }}>{post.likes.toLocaleString()} likes</Text>
        <Text style={{ color: colors.ink, fontSize: 13 }}>
          <Text style={{ fontWeight: "700" }}>{post.user}</Text> {post.caption}
        </Text>
        {post.tags.length > 0 && (
          <Text style={{ fontSize: 12, color: colors.cyan }}>{post.tags.map((t) => `#${t}`).join("  ")}</Text>
        )}
        <Pressable onPress={() => router.push(`/community/comments/${post.id}` as any)}>
          <Text style={{ fontSize: 12, color: colors.muted }}>View all {post.comments.length} comments</Text>
        </Pressable>
      </View>
    </Card>
  );
}

/* =============== HELPER COMPONENTS =============== */
function ProfileTabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && { borderBottomColor: colors.cyan, borderBottomWidth: 2 }]}>
      <Text style={{ fontSize: 13, fontWeight: "700", color: active ? colors.ink : colors.muted }}>{label}</Text>
    </Pressable>
  );
}

function PostsGrid({ posts }: { posts: Post[] }) {
  const { colors } = useTheme();
  if (posts.length === 0) return <View style={styles.empty}><Text style={{ color: colors.muted }}>No posts yet.</Text></View>;
  return (
    <View style={styles.grid}>
      {posts.map((p) => (
        <View key={p.id} style={styles.gridTile}>
          {p.media?.[0] || p.image ? (
            <Image source={{ uri: p.media?.[0] || p.image }} style={styles.gridImg} />
          ) : (
            <View style={styles.textTile}><Text numberOfLines={4} style={styles.textTileText}>{p.caption}</Text></View>
          )}
        </View>
      ))}
    </View>
  );
}

function ReelsList({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const { colors } = useTheme();
  if (posts.length === 0) return <View style={styles.empty}><Text style={{ color: colors.muted }}>No reels yet.</Text></View>;
  return (
    <View style={{ gap: 12 }}>
      {posts.map((p) => (
        <Pressable key={p.id} onPress={() => router.push({ pathname: "/community/reels" as any, params: { postId: p.id } })} style={[styles.reelCard, { borderColor: colors.line }]}>
          <Image source={{ uri: p.media?.[0] || p.image }} style={styles.reelImage} />
          <View style={styles.reelOverlay}>
            <Icon name="play" size={26} color="#fff" />
            <Text style={styles.reelCaption} numberOfLines={2}>{p.caption}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function RepostsList({ posts }: { posts: Post[] }) {
  const { colors } = useTheme();
  if (posts.length === 0) return <View style={styles.empty}><Text style={{ color: colors.muted }}>No reposts yet.</Text></View>;
  return (
    <View style={{ gap: 10 }}>
      {posts.map((p) => (
        <Card key={p.id}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>Reposted</Text>
          <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "700", marginTop: 2 }}>{p.user}</Text>
          <Text style={{ color: colors.ink, fontSize: 13, marginTop: 4 }} numberOfLines={3}>{p.caption}</Text>
        </Card>
      ))}
    </View>
  );
}

function timeAgo(ts: number) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/* =============== STYLES =============== */
const styles = StyleSheet.create({
  /* Nav bar */
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  navItem: { alignItems: "center", gap: 2, minWidth: 60 },
  navLabel: { fontSize: 11 },
  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative"
  },
  dot: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3
  },
  dotText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  /* Messages */
  msgItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  msgAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  /* Search */
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  exploreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  exploreTile: { width: "32.5%", aspectRatio: 1 },
  searchUserRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  searchUserAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  searchPostRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  /* Profile */
  profileWrap: { padding: space.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  avatarWrap: { width: 82, height: 82, borderRadius: 41, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  avatarImg: { width: "100%", height: "100%", borderRadius: 41 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: space.lg },
  statItem: { alignItems: "center", minWidth: 70 },
  tabsSticky: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsRow: { flexDirection: "row" },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridTile: { width: "33.33%", aspectRatio: 1, padding: 1 },
  gridImg: { width: "100%", height: "100%", borderRadius: 2, backgroundColor: "#111" },
  textTile: { flex: 1, borderRadius: 2, backgroundColor: "#121826", padding: 6, justifyContent: "center" },
  textTileText: { color: "#c5cee8", fontSize: 11 },
  reelCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, overflow: "hidden" },
  reelImage: { width: "100%", aspectRatio: 9 / 16, backgroundColor: "#111" },
  reelOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 10, backgroundColor: "rgba(0,0,0,0.35)", flexDirection: "row", alignItems: "center", gap: 8 },
  reelCaption: { color: "#fff", flex: 1, fontSize: 12 },
  empty: { alignItems: "center", paddingVertical: 40 },
  /* Feed post */
  head: { flexDirection: "row", alignItems: "center", gap: 10, padding: space.md },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  followBtn: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  textPost: { padding: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  media: { width: "100%", aspectRatio: 1, backgroundColor: "#111" },
  playOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.2)" },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  /* Create modal */
  createSheet: { width: "100%", maxWidth: 460, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginTop: "auto" },
  createInput: { minHeight: 100, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, textAlignVertical: "top", marginBottom: 12 },
  mediaBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  removeMediaBtn: { position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  /* Modals */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 420, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  avatarEdit: { width: 90, height: 90, borderRadius: 45, borderWidth: StyleSheet.hairlineWidth, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarEditImg: { width: "100%", height: "100%", borderRadius: 45 },
  cameraBadge: { position: "absolute", right: 4, bottom: 4, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  bioInput: { minHeight: 90, textAlignVertical: "top" },
  peopleSheet: { width: "100%", maxWidth: 460, maxHeight: "80%", borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  peopleHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 },
  userRow: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }
});
