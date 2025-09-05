"use client";
import { useState, useEffect } from "react";
import { 
  Box, 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  InputAdornment,
  IconButton
} from "@mui/material";
import { Visibility, VisibilityOff, Login as LoginIcon } from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setCookie } from "cookies-next";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        
        // Set cookies as backup
        setCookie("authToken", "user-token", { 
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: 'lax'
        });
        setCookie("userRole", data.user.role, { 
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: 'lax'
        });
        setCookie("userData", JSON.stringify(data.user), { 
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: 'lax'
        });
        
        const redirectTo = searchParams.get('redirect') || "/dashboard";
        router.push(redirectTo);
      } else {
        setError(data.error || "نام کاربری یا رمز عبور اشتباه است");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("خطا در ورود به سیستم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
        display: "flex",
        alignItems: "center",
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={8} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            textAlign: "center"
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
              سیستم آرشیو اسناد سپهر
            </Typography>
            <Typography variant="body1" color="text.secondary">
              لطفاً برای ورود به سیستم، اطلاعات خود را وارد کنید
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, textAlign: "right" }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="نام کاربری"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="username"
              autoFocus
              sx={{ textAlign: "right" }}
            />

            <TextField
              fullWidth
              label="رمز عبور"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ textAlign: "right" }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                fontSize: "1.1rem"
              }}
            >
              {loading ? "در حال ورود..." : "ورود به سیستم"}
            </Button>


            <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <Link href="/" style={{ textDecoration: "none" }}>
                <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }}>
                  بازگشت به صفحه اصلی
                </Typography>
              </Link>
              <Typography variant="body2" color="text.secondary">
                نسخه 1.0.0
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

