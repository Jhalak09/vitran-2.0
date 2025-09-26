'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Login successful!');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuToggle = (isOpen: boolean) => {
    setMenuOpen(isOpen);
    console.log('Menu toggled:', isOpen);
  };

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth <= 1024;

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        overflow: "hidden",
      }}
    >
      {/* Background SVG */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: "url('/svg/mountain bike-cuate.svg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.15,
            filter: "brightness(0) invert(1)",
          }}
        />
      </div>

      {/* Header with Hamburger and Centered VITRAN */}
      <div style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 10,
        padding: "20px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        {/* Left - Hamburger Menu */}
       
        
        {/* Center - VITRAN Brand */}
        <div style={{ 
          position: "absolute",
          top: '5px',
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center"
        }}>
          <h1
            style={{
              fontSize: isMobile ? "1.5rem" : "3rem",
              fontWeight: "900",
              color: "white",
              margin: "0",
              letterSpacing: "-0.025em",
              textShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            VITRAN
          </h1>
          <p
            style={{
              fontSize: isMobile ? "0.75rem" : "0.875rem",
              color: "rgba(255,255,255,0.9)",
              margin: "2px 0 0 0",
              fontWeight: "500",
              letterSpacing: "0.1em",
            }}
          >
            Milk Distribution Platform
          </p>
        </div>

        {/* Right - Placeholder for balance */}
        <div style={{ width: "44px" }} />
      </div>

      {/* Main Login Card - Centered */}
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          borderRadius: 24,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          overflow: "hidden",
          minHeight: isMobile ? "auto" : 480,
          position: "relative",
          zIndex: 1,
          marginTop: "80px", // Account for fixed header
        }}
      >
        {/* Left - Login form section */}
        <div
          style={{
            flex: 1,
            padding: isMobile ? "40px 24px" : isTablet ? "48px 48px" : "56px 72px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontWeight: "800",
              fontSize: isMobile ? "2rem" : "2.75rem",
              marginBottom: "8px",
              color: "#1e293b",
              letterSpacing: "-0.02em",
            }}
          >
            Hello!
          </h2>
          <p
            style={{
              color: "#475569",
              fontSize: "1.125rem",
              marginBottom: "40px",
              maxWidth: 380,
              lineHeight: 1.6,
              fontWeight: "500",
            }}
          >
            Sign in to your account
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              required
              disabled={isLoading}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                fontSize: "1.0625rem",
                padding: "16px 24px",
                borderRadius: 16,
                border: "2px solid #e2e8f0",
                outline: "none",
                transition: "all 0.2s ease",
                color: "#1e293b",
                fontWeight: "500",
                backgroundColor: isLoading ? "#f1f5f9" : "#fafbfc",
                cursor: isLoading ? "not-allowed" : "text",
              }}
              onFocus={(e) => {
                if (!isLoading) {
                  e.target.style.borderColor = "#2563eb";
                  e.target.style.backgroundColor = "white";
                  e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)";
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.backgroundColor = isLoading ? "#f1f5f9" : "#fafbfc";
                e.target.style.boxShadow = "none";
              }}
            />

            {/* Password Input with Eye Button */}
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                required
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  fontSize: "1.0625rem",
                  padding: "16px 24px",
                  paddingRight: "56px",
                  borderRadius: 16,
                  border: "2px solid #e2e8f0",
                  outline: "none",
                  transition: "all 0.2s ease",
                  color: "#1e293b",
                  fontWeight: "500",
                  backgroundColor: isLoading ? "#f1f5f9" : "#fafbfc",
                  cursor: isLoading ? "not-allowed" : "text",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  if (!isLoading) {
                    e.target.style.borderColor = "#2563eb";
                    e.target.style.backgroundColor = "white";
                    e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)";
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.backgroundColor = isLoading ? "#f1f5f9" : "#fafbfc";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  color: "#64748b",
                  fontSize: "1.25rem",
                  padding: "4px",
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={() => !isLoading && setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                cursor: isLoading ? "not-allowed" : "pointer",
                borderRadius: 16,
                padding: "18px 0",
                fontWeight: "700",
                fontSize: "1.125rem",
                border: "none",
                color: "white",
                background: isLoading
                  ? "#94a3b8"
                  : btnHover
                  ? "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)"
                  : "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                boxShadow: isLoading
                  ? "none"
                  : btnHover
                  ? "0 12px 24px rgba(37, 99, 235, 0.4)"
                  : "0 8px 16px rgba(59, 130, 246, 0.3)",
                transition: "all 0.2s ease",
                transform: isLoading ? "none" : btnHover ? "translateY(-1px)" : "translateY(0)",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Right - Welcome back section */}
        <div
          style={{
            flex: 1,
            background: "linear-gradient(135deg, rgba(239, 246, 255, 0.9) 0%, rgba(219, 234, 254, 0.8) 100%)",
            padding: isMobile ? "40px 24px" : isTablet ? "48px 48px" : "72px 56px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            color: "#1e293b",
            borderRadius: isMobile ? "0 0 24px 24px" : "0 24px 24px 0",
            minHeight: isMobile ? "200px" : "auto",
          }}
        >
          <h3
            style={{
              fontWeight: "900",
              fontSize: isMobile ? "1.75rem" : "2.5rem",
              marginBottom: "24px",
              letterSpacing: "-0.025em",
              color: "#1e40af",
            }}
          >
            Welcome Back!
          </h3>
          <p
            style={{
              fontSize: isMobile ? "1rem" : "1.125rem",
              maxWidth: "90%",
              lineHeight: 1.7,
              fontWeight: "500",
              color: "#475569",
            }}
          >
            Access your milk distribution dashboard to manage orders, track deliveries, monitor inventory, and streamline your business operations.
          </p>
        </div>
      </div>
    </div>
  );
}
