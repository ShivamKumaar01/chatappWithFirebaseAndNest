'use client';

import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firbaseConfig";
import { doc, setDoc } from "firebase/firestore";

const schema = yup.object({
  displayName: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(3, 'Min 3 characters').required('Password is required'),
});

interface FormData {
  displayName: string;
  email: string;
  password: string;
}

const SignupForm: React.FC = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const handleSignup = async ({ email, password, displayName }: FormData) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const photoURL = `https://api.dicebear.com/6.x/initials/svg?seed=${displayName}`;
      await updateProfile(user, { displayName, photoURL });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: displayName,
        email: user.email,
        provider: "email",
        displaypic: photoURL,
        token: user.refreshToken,
        isActive: true
      });

      alert("Signup successful! Please login.");
      router.push('/login'); // ✅ Go to login after signup
    } catch (err: any) {
      console.error("Signup Error:", err.message);
      alert("Signup failed: " + err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || "Anonymous",
        email: user.email,
        provider: "google",
        displaypic: user.photoURL,
        token: user.refreshToken,
        isActive: true,
      });

      router.push('/dashboard'); // ✅ Direct to dashboard after Google sign-in
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Google sign-in failed");
    }
  };

  return (
    <Box display="flex" justifyContent="center" pt={8}>
      <Box width="40%" p={4} boxShadow={3} borderRadius={2}>
        <Typography variant="h5">Signup</Typography>
        <Typography variant="body2" mb={2}>
          Already have an account? <Link href="/login">Login</Link>
        </Typography>

        <form onSubmit={handleSubmit(handleSignup)}>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            {...register("displayName")}
            error={!!errors.displayName}
            helperText={errors.displayName?.message}
          />

          <TextField
            label="Email"
            fullWidth
            margin="normal"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Signup
          </Button>
        </form>

        <Button onClick={handleGoogleSignIn} fullWidth sx={{ mt: 2 }}>
          Sign in with Google
        </Button>
      </Box>
    </Box>
  );
};

export default SignupForm;
