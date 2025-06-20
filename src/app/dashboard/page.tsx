




"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  List,
  ListItemButton,
  Avatar,
  Typography,
  Paper,
  IconButton,
  Badge,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { db, auth } from "../firbaseConfig";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  getDoc,
  updateDoc,
  orderBy,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface UserData {
  uid: string;
  name: string;
  displaypic?: string;
  unreadCount?: number;
  isTyping?: boolean;
  online?: boolean;
}

interface MessageData {
  id?: string;
  senderId: string;
  text: string;
  timestamp: any;
}

const createChatId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);

const ChatPage = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<any>(null);
  const [newMessage, setNewMessage] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    onUpdate: ({ editor }) => {
      setNewMessage(editor.getHTML());
      handleTyping();
    },
  });

  const handleTyping = () => {
    if (!currentUser || !selectedUser) return;
    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    updateDoc(doc(db, "chats", chatId), {
      [`typing_${currentUser.uid}`]: true,
    }).catch(() => {});
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      updateDoc(doc(db, "chats", chatId), {
        [`typing_${currentUser.uid}`]: false,
      }).catch(() => {});
    }, 1000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName,
          displaypic: user.photoURL,
          online: true,
        }, { merge: true });
        window.addEventListener("beforeunload", () => setDoc(doc(db, "users", user.uid), { online: false }, { merge: true }));
      } else router.push("/login");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const arr: UserData[] = [];
      for (let d of snap.docs) {
        const u = d.data() as UserData;
        if (u.uid === currentUser?.uid) continue;
        const chatId = createChatId(currentUser.uid, u.uid);
        const docSnap = await getDoc(doc(db, "chats", chatId));
        const unread = docSnap.exists() ? docSnap.data()[`unread_${currentUser.uid}`] || 0 : 0;
        arr.push({ ...u, unreadCount: unread });
      }
      setUsers(arr);
    };
    fetchUsers();
    const unsub = onSnapshot(collection(db, "users"), fetchUsers);
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedUser) return;
    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp"));

    const unsub = onSnapshot(q, async (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as MessageData) }));
      setMessages(msgs);
      setTimeout(() => {
        chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
      const chatDocRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatDocRef);
      if (chatSnap.exists()) {
        await updateDoc(chatDocRef, {
          [`unread_${currentUser.uid}`]: 0,
        });
      }
    });

    const chatDocUnsub = onSnapshot(doc(db, "chats", chatId), (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const typing = data[`typing_${selectedUser.uid}`] || false;
      setUsers((prev) =>
        prev.map((u) => (u.uid === selectedUser.uid ? { ...u, isTyping: typing } : u))
      );
    });

    return () => {
      unsub();
      chatDocUnsub();
    };
  }, [currentUser, selectedUser]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUser) return;
    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    const docRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(docRef);

    if (!chatSnap.exists()) {
      await setDoc(docRef, {
        users: [currentUser.uid, selectedUser.uid],
        lastMessage: newMessage,
        timestamp: serverTimestamp(),
        [`unread_${selectedUser.uid}`]: 1,
        [`typing_${currentUser.uid}`]: false,
      });
    } else {
      const unread = chatSnap.data()?.[`unread_${selectedUser.uid}`] || 0;
      await updateDoc(docRef, {
        lastMessage: newMessage,
        timestamp: serverTimestamp(),
        [`unread_${selectedUser.uid}`]: unread + 1,
        [`typing_${currentUser.uid}`]: false,
      });
    }

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: currentUser.uid,
      text: newMessage,
      timestamp: serverTimestamp(),
    });
    setNewMessage("");
    editor?.commands.clearContent();
    setShowEmojiPicker(false); //  hide emoji picker after sending
  };

  const addEmoji = (e: any) => {
    editor?.commands.insertContent(e.native);
    setShowEmojiPicker(false); //  hide emoji picker after selecting emoji
  };

  const handleLogout = async () => {
    if (currentUser) {
      await setDoc(doc(db, "users", currentUser.uid), { online: false }, { merge: true });
      await signOut(auth);
      router.push("/login");
    }
  };

  return (
    <Box display="flex" height="100vh">
      {/* Left Sidebar */}
      <Box width="30%" bgcolor="#f0f2f5" p={2} overflow="auto">
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TextField
            fullWidth
            label="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            onClick={handleLogout}
            style={{ padding: "6px 12px", borderRadius: "4px", background: "#1976d2", color: "white", border: "none", height: "40px" }}
          >Logout</button>
        </Box>
        <List>
          {users.filter((u) => u.name?.toLowerCase().includes(searchInput.toLowerCase())).map((u) => (
            <ListItemButton key={u.uid} onClick={() => setSelectedUser(u)}>
              <Badge overlap="circular" variant={u.online ? "dot" : undefined} color="success">
                <Avatar src={u.displaypic} />
              </Badge>
              <Box ml={2}>
                <Typography fontWeight="bold">{u.name}</Typography>
                {u.isTyping && <Typography fontSize={12} color="green">Typing...</Typography>}
                {!!u.unreadCount && <Typography fontSize={12} color="red">+{u.unreadCount}</Typography>}
              </Box>
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Right Chat Area */}
      <Box flexGrow={1} display="flex" flexDirection="column" position="relative">
        <Box p={2} bgcolor="#fff" borderBottom="1px solid #ddd" display="flex" alignItems="center" gap={2}>
          {selectedUser?.displaypic && <Avatar src={selectedUser.displaypic} />}
          <Typography variant="h6">{selectedUser?.name || "Select a user to chat"}</Typography>
        </Box>

        <Paper ref={chatRef} sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1, bgcolor: "#fafafa" }}>
          {messages.map((m) => {
            const isMe = m.senderId === currentUser?.uid;
            const avatarUrl = isMe ? currentUser?.photoURL : selectedUser?.displaypic;
            const time = m.timestamp?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return (
              <Box key={m.id} display="flex" justifyContent={isMe ? "flex-end" : "flex-start"} alignItems="flex-end" mb={1}>
                {!isMe && <Avatar src={avatarUrl} sx={{ width: 24, height: 24, mr: 1 }} />}
                <Box sx={{ backgroundColor: isMe ? "#dcf8c6" : "#fff", px: 2, py: 1, borderRadius: 2, maxWidth: "70%", boxShadow: 1 }}>
                  <Typography fontSize={14} dangerouslySetInnerHTML={{ __html: m.text }} />
                  <Typography fontSize={10} color="gray" textAlign="right">{time}</Typography>
                </Box>
                {isMe && <Avatar src={avatarUrl} sx={{ width: 24, height: 24, ml: 1 }} />}
              </Box>
            );
          })}
        </Paper>

        {/* Message Input Box */}
        {selectedUser && (
          <Box display="flex" p={1} borderTop="1px solid #ddd" alignItems="center" gap={1}>
            <IconButton onClick={() => setShowEmojiPicker(prev => !prev)}>😊</IconButton>
            <Box
              sx={{
                flexGrow: 1,
                border: "1px solid #ccc",
                borderRadius: 2,
                padding: 1,
                minHeight: 50,
                background: "#fff",
                overflow: "auto",
              }}
              onClick={() => editor?.commands.focus()}
            >
              <EditorContent
                editor={editor}
                style={{ outline: "none" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
            </Box>
            <IconButton onClick={sendMessage}>
              <SendIcon />
            </IconButton>
          </Box>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <Box
            sx={{
              position: "absolute",
              bottom: 70,
              left: 60,
              zIndex: 1000,
            }}
          >
            <Picker data={data} onEmojiSelect={addEmoji} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatPage;
