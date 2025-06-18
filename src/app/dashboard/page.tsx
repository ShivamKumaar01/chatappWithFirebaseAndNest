
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
  startAfter,
  getDocs,
  limit as limitFn,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

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
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<any>(null);
  const debounceTimer = useRef<any>(null);

  // ✅ Handle Auth
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

  // ✅ Load users list
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, "users"), async (snap) => {
      const arr: UserData[] = [];
      for (let d of snap.docs) {
        const u = d.data() as UserData;
        if (u.uid === currentUser.uid) continue;
        const chatId = createChatId(currentUser.uid, u.uid);
        const docSnap = await getDoc(doc(db, "chats", chatId));
        const unread = docSnap.exists() ? docSnap.data()[`unread_${currentUser.uid}`] || 0 : 0;
        arr.push({ ...u, unreadCount: unread });
      }
      setUsers(arr);
    });
    return () => unsub();
  }, [currentUser]);

  // ✅ Real-time message listener
  useEffect(() => {
    if (!currentUser || !selectedUser) return;
    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as MessageData) }));
      setMessages(msgs);
      setTimeout(() => {
        chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
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
  };

  const onTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!currentUser || !selectedUser) return;
    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    await updateDoc(doc(db, "chats", chatId), {
      [`typing_${currentUser.uid}`]: true,
    }).catch(() => {});
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      updateDoc(doc(db, "chats", chatId), {
        [`typing_${currentUser.uid}`]: false,
      }).catch(() => {});
    }, 1000);
  };

  const addEmoji = (e: any) => setNewMessage((prev) => prev + e.native);

  return (
    <Box display="flex" height="100vh">
      {/* Left Sidebar */}
      <Box width="30%" bgcolor="#f0f2f5" p={2} overflow="auto">
        <TextField
          fullWidth
          label="Search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
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
      <Box flexGrow={1} display="flex" flexDirection="column">
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
                  <Typography fontSize={14}>{m.text}</Typography>
                  <Typography fontSize={10} color="gray" textAlign="right">{time}</Typography>
                </Box>
                {isMe && <Avatar src={avatarUrl} sx={{ width: 24, height: 24, ml: 1 }} />}
              </Box>
            );
          })}
        </Paper>

        {selectedUser && (
          <Box display="flex" p={1} borderTop="1px solid #ddd" alignItems="center">
            <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)}>😊</IconButton>
            <TextField
              fullWidth
              value={newMessage}
              onChange={onTyping}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type message..."
            />
            <IconButton onClick={sendMessage}><SendIcon /></IconButton>
          </Box>
        )}
        {showEmojiPicker && (
          <Box position="absolute" bottom={70} left="33%" zIndex={99}>
            <Picker data={data} onEmojiSelect={addEmoji} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatPage;