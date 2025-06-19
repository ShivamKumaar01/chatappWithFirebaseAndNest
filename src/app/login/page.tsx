// 'use client';
// import React from 'react';
// import { useForm } from 'react-hook-form';
// import { yupResolver } from '@hookform/resolvers/yup';
// import * as yup from 'yup';
// import {
//   Box,
//   Button,
//   TextField,
//   Typography,
// } from '@mui/material';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth, db } from '../firbaseConfig';
// import { doc, setDoc } from 'firebase/firestore';


// const schema = yup.object().shape({
//   email: yup.string().email('Invalid email').required('Email is required'),
//   password: yup.string().min(3).required('Password is required'),
// });

// interface LoginData {
//   email: string;
//   password: string;
// }

// const LoginForm: React.FC = () => {
//   const router = useRouter();

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginData>({
//     resolver: yupResolver(schema),
//   });

//   const handleLogin = async (data: LoginData) => {
//     try {
//       const result = await signInWithEmailAndPassword(auth, data.email, data.password);
//       const user = result.user;

     
//       await setDoc(doc(db, 'users', user.uid), {
//         isActive: true,
//         token: user.refreshToken,
//       }, { merge: true });

//       console.log('Login successful');
//       router.push('/dashboard');
//     } catch (error: any) {
//       console.error('Login Error:', error.message);
//       alert('Invalid credentials or error logging in');
//     }
//   };

//   return (
//     <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
//       <Box width="40%" p={4} boxShadow={3} borderRadius={2}>
//         <Typography variant="h5" gutterBottom>Login</Typography>
//         <Typography variant="body2" mb={2}>
//           Don't have an account? <Link href="/signup">Signup</Link>
//         </Typography>

//         <form onSubmit={handleSubmit(handleLogin)}>
//           <TextField
//             label="Email"
//             fullWidth
//             margin="normal"
//             {...register('email')}
//             error={!!errors.email}
//             helperText={errors.email?.message}
//           />

//           <TextField
//             label="Password"
//             type="password"
//             fullWidth
//             margin="normal"
//             {...register('password')}
//             error={!!errors.password}
//             helperText={errors.password?.message}
//           />

//           <Button
//             type="submit"
//             variant="contained"
//             color="primary"
//             fullWidth
//             sx={{ mt: 2 }}
//           >
//             Login
//           </Button>
//         </form>
//       </Box>
//     </Box>
//   );
// };

// export default LoginForm;


'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firbaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(3).required('Password is required'),
});

interface LoginData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: yupResolver(schema),
  });

  const handleLogin = async (data: LoginData) => {
    try {
      const result = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = result.user;

      await setDoc(doc(db, 'users', user.uid), {
        isActive: true,
        token: user.refreshToken,
      }, { merge: true });

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login Error:', error.message);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Box width="40%" p={4} boxShadow={3} borderRadius={2}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        <Typography variant="body2" mb={2}>
          Don&apos;t have an account? <Link href="/signup">Signup</Link>
        </Typography>

        <form onSubmit={handleSubmit(handleLogin)}>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Login
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default LoginForm;

