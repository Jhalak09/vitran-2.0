'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
}

const HamburgerNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { 
      href: '/customer', 
      label: 'Customers', 
      icon: '👥',
      description: 'Client relationship management'
    },
    { 
      href: 'customer/customer-relations', 
      label: 'Customer Relations', 
      icon: '🛍️',
      description: 'Product-customer-worker insights'
    },
    { 
      href: '/users', 
      label: 'User Management', 
      icon: '👤',
      description: 'System administration'
    },
    
  ];

  const isActive = (href: string) => pathname === href;

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (href: string) => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Custom CSS to hide scrollbars globally */}
      <style jsx global>{`
        .hide-scrollbar {
          /* Hide scrollbar for Chrome, Safari and Opera */
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-blue-900/30 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Unified Hamburger + Navigation Container */}
      <div className="fixed top-4 left-4 z-50">
        <div 
          className={`
            relative transition-all duration-500 ease-in-out transform-gpu
            ${isOpen 
              ? 'w-80 h-auto min-h-96 max-h-[90vh] bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-2xl shadow-2xl border border-blue-200' 
              : 'w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-500 hover:to-blue-600'
            }
          `}
        >
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-blue-200/10 rounded-2xl"></div>
          
          {/* Hamburger Button */}
          <button
            onClick={handleToggle}
            className={`
              absolute top-0 left-0 w-14 h-14 flex items-center justify-center
              transition-all duration-300 ease-in-out
              ${isOpen ? 'bg-blue-500/10 backdrop-blur-sm' : 'hover:bg-blue-400/20'}
              rounded-xl z-10
            `}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {/* Hamburger Lines */}
            <div className="relative w-6 h-6">
              <span
                className={`
                  absolute left-0 block w-full h-0.5 rounded-full
                  transition-all duration-300 ease-in-out
                  ${isOpen 
                    ? 'top-1/2 rotate-45 transform -translate-y-1/2 bg-blue-600' 
                    : 'top-1 bg-white'
                  }
                `}
              />
              <span
                className={`
                  absolute left-0 top-1/2 block w-full h-0.5 rounded-full
                  transition-all duration-200 ease-in-out transform -translate-y-1/2
                  ${isOpen 
                    ? 'opacity-0 scale-0 bg-blue-600' 
                    : 'opacity-100 scale-100 bg-white'
                  }
                `}
              />
              <span
                className={`
                  absolute left-0 block w-full h-0.5 rounded-full
                  transition-all duration-300 ease-in-out
                  ${isOpen 
                    ? 'top-1/2 -rotate-45 transform -translate-y-1/2 bg-blue-600' 
                    : 'bottom-1 bg-white'
                  }
                `}
              />
            </div>
          </button>

          {/* Navigation Content - Expands from the button */}
          <div 
            className={`
              transition-all duration-500 ease-in-out flex flex-col
              ${isOpen 
                ? 'opacity-100 transform scale-100 h-auto min-h-96 max-h-[90vh]' 
                : 'opacity-0 transform scale-95 pointer-events-none h-0'
              }
            `}
          >
            {/* Header - Fixed at top */}
            <div className="pt-16 px-6 pb-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-sm font-bold text-white">V</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-blue-900">Vitran 2.0</h1>
                  <p className="text-blue-600/70 text-xs">Management System</p>
                </div>
              </div>
            </div>

            {/* Navigation Items - Scrollable area */}
            <nav className="px-4 flex-1 overflow-y-auto hide-scrollbar">
              <div className="space-y-2 pb-4">
                {navItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      group flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300
                      ${isActive(item.href) 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-105' 
                        : 'text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:scale-105'
                      }
                      hover:translate-x-1
                    `}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                      opacity: isOpen ? 1 : 0,
                      transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
                    }}
                  >
                    <div className={`
                      text-lg p-2 rounded-lg transition-all duration-300
                      ${isActive(item.href) 
                        ? 'bg-white/20 shadow-inner' 
                        : 'group-hover:bg-blue-200/50'
                      }
                    `}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className="text-xs opacity-75 truncate">{item.description}</div>
                    </div>
                    {isActive(item.href) && (
                      <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                    )}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Footer - Fixed at bottom */}
            <div className="px-4 pb-4 flex-shrink-0">
              <div className="text-center border-t border-blue-200/50 pt-3">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-600/70">System Online</span>
                </div>
                <p className="text-xs text-blue-500/60">&copy; 2025 Vitran 2.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HamburgerNavigation;
