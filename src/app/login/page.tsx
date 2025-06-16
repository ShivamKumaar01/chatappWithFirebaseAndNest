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
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/redux/store";
// import { loginUser } from '@/redux/loginslice';
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firbaseConfig";
// import toast, { Toaster } from 'react-hot-toast';

const schema = yup.object().shape({
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
}

const LoginForm: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
//   const user = useSelector((state: RootState) => state.login.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });
  async function loginWithGoogle(){
    console.log("login with goole")
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Google SignIn Success:", user);
        console.log("Google data Success:", user.displayName,user.email,user.photoURL);
        
        router.push("/dashboard");
      } catch (error:any) {
        console.error("Google SignIn Error:", error.message);
        
      }
  }

  const onSubmit = (data: FormData) => {
  
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
            Login
          </Typography>
          <h6>
            Don't have an account? <Link href={"/pages/signup"}>Signup</Link>
          </h6>

          <form onSubmit={handleSubmit(onSubmit)}>
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
              Login
            </Button>
          </form>
          <Button onClick={loginWithGoogle}>sign in with google</Button>
          <Button>sign in with apple</Button>

          
        </Box>
      </Box>
    </>
  );
};

export default LoginForm;