'use client';
import React, { useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, provider,db } from "../firbaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";


const schema = yup.object().shape({
  displayName:yup.string().required('display Name is required'),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .min(3, "Password must be at least 3 characters")
    .required("Password is required"),
});

interface FormData {
  email: string;
  password: string;
  displayName:string
}

const LoginForm: React.FC = () => {

  const router = useRouter();


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });


const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("User Info:", user);

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: user.displayName || "Anonymous",
      email: user.email,
      provider: "google",
      displaypic:user.photoURL,
      token:user.refreshToken,
      isActive:true
    });
    router.push('/dashboard');
    console.log("User saved to Firestore");
  } catch (error) {
    console.error("Google Sign-In Error:", error);
  }
};



const handleSignup = async (email: string, password: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    await updateProfile(user, {
      displayName: name,
      photoURL: `https://api.dicebear.com/6.x/initials/svg?seed=${name}`,
    });

   
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: user.email,
      provider: "email",
      displaypic: user.photoURL ?? `https://api.dicebear.com/6.x/initials/svg?seed=${name}`,
      token: user.refreshToken,
      isActive: true
    });
    router.push('/dashboard')

    console.log("Signup successful and profile updated");
  } catch (err: any) {
    console.error("Signup Error:", err.message);
  }
};



  const onSubmit = (data: FormData) => {
    console.log(data,"this is form data")
    handleSignup(data.email,data.password,data.displayName)
    // redirect('/dashboard')
  
  };

  return (
    <>
      

      <Box display={"flex"} paddingTop={"6%"} width={"100vw"}>
        <Box
          sx={{
            minWidth: 300,
            mx: "auto",
            mt: 5,
            p: 3,
            boxShadow: 3,
            borderRadius: 2,
            width: "50%",
          }}
        >
          <Typography variant="h5" gutterBottom>
            Signup
          </Typography>
          <h6>
             Have an account? <Link href={"/login"}>login</Link>
          </h6>

          <form onSubmit={handleSubmit(onSubmit)}>
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
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              signup
            </Button>
          </form>
          <Button onClick={handleGoogleSignIn}>sign in with google</Button>
          {/* <Button>sign in with apple</Button> */}

          
        </Box>
      </Box>
    </>
  );
};

export default LoginForm;