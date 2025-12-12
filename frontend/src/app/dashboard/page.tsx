'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HamburgerNavigation from '@/components/HamburgerNavigation';


interface DashboardCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string; 
  route: string;
  color: string;
}


export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const router = useRouter();


  // ✅ UPDATED: Dashboard cards sequence
  const dashboardCards: DashboardCard[] = [
    {
      id: 'inventory',
      title: 'Inventory',
      subtitle: 'Management',
      icon: '📦',
      route: '/inventory',
      color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      id: 'verification',
      title: 'Daily Entry',
      subtitle: 'Verification',
      icon: '✅',
      route: '/data-verification',
      color: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)'
    },
    {
      id: 'notifications',
      title: 'Notify',
      subtitle: 'Worker',
      icon: '📢',
      route: '/notifications',
      color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    },
    {
      id: 'billing',
      title: 'Bill',
      subtitle: 'Generation',
      icon: '📄',
      route: '/billing',
      color: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'
    },
    {
      id: 'users',
      title: 'Manage',
      subtitle: 'Worker',
      icon: '👥',
      route: '/manage-users',
      color: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
    },
    {
      id: 'customer',
      title: 'Manage',
      subtitle: 'Customer',
      icon: '👤',
      route: '/customer',
      color: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
    },
    {
      id: 'products',
      title: 'Manage',
      subtitle: 'Products',
      icon: '🥛',
      route: '/products',
      color: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
    }
  ];


  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
      const dateString = now.toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    setCurrentTime(`${dateString} | ${timeString}`);
    };


    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');


    
    if (!token) {
      router.push('/');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };


  const handleCardClick = (route: string) => {
    router.push(route);
  };



  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.5rem' }}>Loading...</div>
      </div>
    );
  }


  return (
    <>
      {/* 🎯 MOVE HamburgerNavigation OUTSIDE and BEFORE everything */}
      <HamburgerNavigation />
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          zIndex: 0,
        }} />


        {/* Header - REDUCED z-index so menu can overlay it */}
        <header style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
          padding: '20px 40px',
          boxShadow: '0 8px 32px rgba(30, 64, 175, 0.3)',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1400px',
            margin: '0 auto',
          }}>
            {/* Logo Section - ADD padding to avoid hamburger overlap */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              paddingLeft: '70px'
            }}>
              {/* Logo */}
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '900',
                color: 'white',
                margin: 0,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                Vitaran
              </h1>
            </div>


            {/* Current Time */}
            <div style={{
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '500',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              textAlign: 'right'
            }}>
              {currentTime}
            </div>
          </div>
        </header>


        {/* Main Content */}
        <main style={{
          padding: '40px',
          maxWidth: '1400px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10,
        }}>
          {/* Welcome Section */}
          <div style={{
            marginBottom: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#1e293b',
                margin: '0 0 8px 0',
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Welcome back, {user.name || 'Admin'}!
                
              </h2>
                
              <p style={{
                color: '#64748b',
                fontSize: '1.1rem',
                margin: 0,
                fontWeight: '500'
              }}>
                Manage your milk distribution operations efficiently
              </p>
            </div>


            <button
              onClick={handleLogout}
              style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLButtonElement;
                  target.style.transform = 'translateY(-2px)';
                  target.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLButtonElement;
                  target.style.transform = 'translateY(0)';
                  target.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.3)';
              }}
              >
              Logout
              </button>
          </div>


          {/* Dashboard Cards Grid - REDUCED CARD SIZE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginTop: '40px'
          }}>
            {dashboardCards.map((card, index) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.route)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: hoveredCard === card.id 
                    ? '0 16px 32px rgba(59, 130, 246, 0.15)'
                    : '0 6px 20px rgba(0, 0, 0, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredCard === card.id ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)',
                  border: hoveredCard === card.id ? '2px solid rgba(59, 130, 246, 0.2)' : '2px solid transparent',
                  position: 'relative',
                  overflow: 'hidden',
                  animationDelay: `${index * 100}ms`,
                  animation: 'slideUp 0.6s ease-out forwards',
                }}
              >
                {/* Gradient Overlay - REDUCED SIZE */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '80px',
                  height: '80px',
                  background: card.color,
                  borderRadius: '50%',
                  transform: 'translate(35px, -35px)',
                  opacity: hoveredCard === card.id ? 0.1 : 0.05,
                  transition: 'opacity 0.3s ease',
                }} />


                {/* Card Content */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  {/* Icon - REDUCED SIZE */}
                  <div style={{
                    fontSize: '2.5rem',
                    marginBottom: '12px',
                    transform: hoveredCard === card.id ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                  }}>
                    {card.icon}
                  </div>


                  {/* Title - REDUCED SIZE */}
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: '0 0 4px 0',
                    transition: 'color 0.3s ease',
                  }}>
                    {card.title}
                  </h3>


                  {/* Subtitle - REDUCED SIZE */}
                  <p style={{
                    fontSize: '1rem',
                    color: '#64748b',
                    margin: 0,
                    fontWeight: '500',
                  }}>
                    {card.subtitle}
                  </p>


                  {/* Hover Arrow */}
                  <div style={{
                    marginTop: '12px',
                    color: '#3b82f6',
                    fontSize: '1.125rem',
                    opacity: hoveredCard === card.id ? 1 : 0,
                    transform: hoveredCard === card.id ? 'translateX(4px)' : 'translateX(0)',
                    transition: 'all 0.3s ease',
                  }}>
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>


        {/* Add keyframes for animations */}
        <style jsx>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
}
